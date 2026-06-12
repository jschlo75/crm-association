import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const campagneSchema = z.object({
  nom: z.string().min(1),
  sujet: z.string().min(1),
  contenu: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const campagnes = await prisma.campagne.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { nom: true } },
      _count: { select: { destinataires: true } },
    },
  });

  return NextResponse.json(campagnes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "RESTREINT"))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const parsed = campagneSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // Récupérer les interlocuteurs ayant donné leur consentement email
  const interlocuteurs = await prisma.user.findMany({
    where: { consentementEmailsInfo: true, actif: true },
    select: { id: true, prenom: true, nom: true, email: true },
  });

  const campagne = await prisma.campagne.create({
    data: {
      ...parsed.data,
      userId,
      nbDestinataires: interlocuteurs.length,
      destinataires: {
        create: interlocuteurs.map((u) => ({
          email: u.email,
          nom: [u.prenom, u.nom].filter(Boolean).join(" "),
        })),
      },
    },
  });

  return NextResponse.json(campagne, { status: 201 });
}
