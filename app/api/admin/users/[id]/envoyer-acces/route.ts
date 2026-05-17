import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n").trim();
}

/** Génère un mot de passe aléatoire lisible (12 caractères) */
function genererMotDePasse(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Générer et sauvegarder le nouveau mot de passe
  const motDePasse = genererMotDePasse();
  const hash = await bcrypt.hash(motDePasse, 12);
  await prisma.user.update({ where: { id }, data: { password: hash } });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "contact@artdelespalier.org";
  const fromName = process.env.EMAIL_FROM_NAME || "Groupe arboriculture fruitiere familiale";
  const replyTo = process.env.EMAIL_REPLY_TO || fromEmail;

  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
  }

  const portalUrl = process.env.NEXTAUTH_URL || "https://crm-association.vercel.app";

  const htmlBody = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
      <tr><td style="background:#67aa40;padding:20px 32px;">
        <p style="margin:0;color:#ffffff;font-size:16px;font-weight:bold;">Groupe arboriculture fruitiere familiale</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px;color:#333;font-size:15px;">Bonjour ${user.nom},</p>
        <p style="margin:0 0 16px;color:#333;font-size:15px;">
          Michel Schlosser vous invite à accéder au portail de contacts du groupe de réflexion sur l'arboriculture fruitière.
        </p>
        <p style="margin:0 0 8px;color:#555;font-size:14px;font-weight:bold;">Vos identifiants de connexion :</p>
        <table cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-left:4px solid #67aa40;border-radius:4px;padding:16px;margin:0 0 24px;width:100%;">
          <tr><td style="padding:4px 16px;">
            <p style="margin:0 0 8px;font-size:14px;color:#333;"><strong>Adresse du portail :</strong><br>
              <a href="${portalUrl}/login" style="color:#67aa40;">${portalUrl}/login</a>
            </p>
            <p style="margin:0 0 8px;font-size:14px;color:#333;"><strong>Identifiant :</strong> ${user.email}</p>
            <p style="margin:0;font-size:14px;color:#333;"><strong>Mot de passe :</strong> ${motDePasse}</p>
          </td></tr>
        </table>
        <p style="margin:0 0 24px;color:#888;font-size:13px;">
          Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe après votre première connexion, depuis la rubrique <em>Mon profil</em>.
        </p>
        <p style="margin:0;color:#aaa;font-size:12px;border-top:1px solid #eee;padding-top:16px;">
          Cet email vous a été envoyé car votre adresse a été enregistrée dans notre portail.<br>
          Pour toute question, répondez directement à cet email.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const textBody = `Bonjour ${user.nom},

Michel Schlosser vous invite à accéder au portail de contacts du groupe de réflexion sur l'arboriculture fruitière.

Vos identifiants de connexion :
  Adresse : ${portalUrl}/login
  Identifiant : ${user.email}
  Mot de passe : ${motDePasse}

Pour des raisons de sécurité, modifiez votre mot de passe après votre première connexion (rubrique "Mon profil").

Pour toute question, répondez directement à cet email.`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [user.email],
      reply_to: replyTo,
      subject: "Acces au portail de contacts - arboriculture fruitiere",
      html: htmlBody,
      text: textBody,
      headers: {
        "X-Entity-Ref-ID": user.id,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message || "Erreur envoi email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: user.email });
}
