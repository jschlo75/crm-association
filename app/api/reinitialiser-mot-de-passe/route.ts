import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — vérifier si le token est valide (appelé par la page au chargement)
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// POST — appliquer le nouveau mot de passe
export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password)
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "Mot de passe trop court (8 caractères minimum)" }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date())
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: record.email },
    data: { password: hash },
  });

  // Supprimer le token utilisé
  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
