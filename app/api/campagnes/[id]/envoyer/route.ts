import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
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
  const fromEmail = process.env.EMAIL_FROM || "noreply@snhf.fr";
  let nbEnvoyes = 0;
  const erreurs: string[] = [];

  if (apiKey) {
    for (const dest of campagne.destinataires) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `SNHF <${fromEmail}>`,
            to: [dest.email],
            subject: campagne.sujet,
            html: campagne.contenu,
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
