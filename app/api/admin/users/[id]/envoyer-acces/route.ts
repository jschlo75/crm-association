import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
  const fromEmail = process.env.EMAIL_FROM || "noreply@artdelespalier.org";
  const fromName = process.env.EMAIL_FROM_NAME || "Groupe arboriculture fruitière familiale";

  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
  }

  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <p>Bonjour,</p>

  <p>Vous allez recevoir un eMail de Michel Schlosser, à propos du portail de contacts
  du groupe de réflexion sur l'arboriculture fruitière</p>

  <p>Voici l'accès à ce portail :</p>

  <div style="background: #f5f5f5; border-left: 4px solid #67aa40; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
    <p style="margin: 0 0 8px 0;">
      <strong>Lien :</strong>
      <a href="https://crm-association.vercel.app/login" style="color: #67aa40;">
        https://crm-association.vercel.app/login
      </a>
    </p>
    <p style="margin: 0 0 8px 0;"><strong>Utilisateur :</strong> ${user.email}</p>
    <p style="margin: 0;"><strong>Mot de passe :</strong> ${motDePasse}</p>
  </div>

  <p style="color: #888; font-size: 13px;">
    Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe
    après votre première connexion, depuis la rubrique "Mon profil".
  </p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [user.email],
      subject: "Accès au portail de contacts du groupe de réflexion sur l'arboriculture fruitière",
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message || "Erreur envoi email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: user.email });
}
