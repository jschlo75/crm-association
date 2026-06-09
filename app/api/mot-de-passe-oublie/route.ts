import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  // On répond toujours 200 pour ne pas révéler si l'email existe
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.actif) return NextResponse.json({ ok: true });

  // Supprimer les anciens tokens pour cet email
  await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });

  // Générer un token sécurisé, valable 1 heure
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { email: user.email, token, expiresAt },
  });

  const portalUrl = process.env.NEXTAUTH_URL || "https://crm-association.vercel.app";
  const resetUrl = `${portalUrl}/reinitialiser-mot-de-passe?token=${token}`;

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "contact@artdelespalier.org";
  const fromName = process.env.EMAIL_FROM_NAME || "Groupe arboriculture fruitiere familiale";
  const replyTo = process.env.EMAIL_REPLY_TO || fromEmail;

  if (!apiKey) return NextResponse.json({ ok: true });

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
        <p style="margin:0 0 16px;color:#333;font-size:15px;">Bonjour ${user.prenom ? user.prenom + " " : ""}${user.nom},</p>
        <p style="margin:0 0 16px;color:#333;font-size:15px;">
          Vous avez demandé la réinitialisation de votre mot de passe.
        </p>
        <p style="margin:0 0 24px;color:#333;font-size:15px;">
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong>1 heure</strong>.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr><td style="background:#67aa40;border-radius:6px;padding:12px 28px;">
            <a href="${resetUrl}" style="color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">
              Réinitialiser mon mot de passe
            </a>
          </td></tr>
        </table>
        <p style="margin:0 0 16px;color:#888;font-size:13px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${resetUrl}" style="color:#67aa40;word-break:break-all;">${resetUrl}</a>
        </p>
        <p style="margin:0;color:#aaa;font-size:12px;border-top:1px solid #eee;padding-top:16px;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe reste inchangé.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const textBody = `Bonjour ${user.prenom ? user.prenom + " " : ""}${user.nom},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien suivant pour choisir un nouveau mot de passe (valable 1 heure) :
${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [user.email],
      reply_to: replyTo,
      subject: "Reinitialisation de votre mot de passe",
      html: htmlBody,
      text: textBody,
    }),
  });

  return NextResponse.json({ ok: true });
}
