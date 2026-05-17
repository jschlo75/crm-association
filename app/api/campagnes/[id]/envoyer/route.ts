import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Convertit du HTML basique en texte brut (fallback pour clients mail sans HTML) */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "RESTREINT"))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const campagne = await prisma.campagne.findUnique({
    where: { id },
    include: { destinataires: true },
  });

  if (!campagne) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (campagne.statut === "ENVOYEE")
    return NextResponse.json({ error: "Déjà envoyée." }, { status: 400 });
  if (campagne.destinataires.length === 0)
    return NextResponse.json({ error: "Aucun destinataire." }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "contact@artdelespalier.org";
  const fromName = process.env.EMAIL_FROM_NAME || "Groupe arboriculture fruitiere familiale";
  const replyTo = process.env.EMAIL_REPLY_TO || fromEmail;
  let nbEnvoyes = 0;
  const erreurs: string[] = [];

  const textContent = htmlToText(campagne.contenu);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  if (apiKey) {
    for (let i = 0; i < campagne.destinataires.length; i++) {
      const dest = campagne.destinataires[i];
      // Pause toutes les 10 emails pour éviter le burst (détection spam)
      if (i > 0 && i % 10 === 0) await sleep(2000);
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [dest.email],
            reply_to: replyTo,
            subject: campagne.sujet,
            html: campagne.contenu,
            text: textContent,
            headers: {
              "List-Unsubscribe": `<mailto:${replyTo}?subject=Desabonnement>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              "X-Entity-Ref-ID": campagne.id,
            },
          }),
        });

        if (res.ok) {
          await prisma.campagneDestinataire.update({
            where: { id: dest.id },
            data: { envoye: true },
          });
          nbEnvoyes++;
        } else {
          const err = await res.json();
          await prisma.campagneDestinataire.update({
            where: { id: dest.id },
            data: { erreur: err.message || "Erreur inconnue" },
          });
          erreurs.push(dest.email);
        }
      } catch {
        erreurs.push(dest.email);
      }
    }
  } else {
    // Mode simulation : pas de provider configuré
    await prisma.campagneDestinataire.updateMany({
      where: { campagneId: campagne.id },
      data: { envoye: true },
    });
    nbEnvoyes = campagne.destinataires.length;
  }

  const updated = await prisma.campagne.update({
    where: { id: campagne.id },
    data: {
      statut: "ENVOYEE",
      dateEnvoi: new Date(),
      nbDestinataires: nbEnvoyes,
    },
  });

  return NextResponse.json({
    campagne: updated,
    nbEnvoyes,
    nbErreurs: erreurs.length,
    simulation: !apiKey,
  });
}
