import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const id = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, prenom: true, nom: true, email: true, role: true, organisationId: true, consentementPartageContacts: true, consentementPartageContactsLe: true, consentementEmailsInfo: true, consentementEmailsInfoLe: true, consentementMisAJourLe: true },
  });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const id = (session.user as { id: string }).id;
  const { prenom, nom, email, ancienMotDePasse, nouveauMotDePasse, consentementPartageContacts, consentementEmailsInfo } = await req.json();

  if (!nom || !email) {
    return NextResponse.json({ error: "Nom et email obligatoires" }, { status: 400 });
  }

  // Vérifier unicité email si changé
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé par un autre compte" }, { status: 409 });
  }

  // Changement de mot de passe optionnel
  let passwordData = {};
  if (nouveauMotDePasse) {
    if (!ancienMotDePasse) {
      return NextResponse.json({ error: "L'ancien mot de passe est requis" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    const valid = await bcrypt.compare(ancienMotDePasse, user!.password);
    if (!valid) {
      return NextResponse.json({ error: "Ancien mot de passe incorrect" }, { status: 400 });
    }
    if (nouveauMotDePasse.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
    }
    passwordData = { password: await bcrypt.hash(nouveauMotDePasse, 10) };
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      prenom: prenom || null,
      nom,
      email,
      consentementPartageContacts: !!consentementPartageContacts,
      consentementEmailsInfo: !!consentementEmailsInfo,
      consentementMisAJourLe: new Date(),
      ...passwordData,
    },
    select: { id: true, prenom: true, nom: true, email: true, role: true, consentementPartageContacts: true, consentementEmailsInfo: true, consentementMisAJourLe: true },
  });

  return NextResponse.json(updated);
}
