import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const evenements = await prisma.evenement.findMany({
    orderBy: { date: "asc" },
    include: { _count: { select: { participants: true } } },
  });
  return NextResponse.json(evenements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { titre, date, lieu, lien, objectifs } = await req.json();
  if (!titre || !date) return NextResponse.json({ error: "Titre et date obligatoires" }, { status: 400 });

  const evenement = await prisma.evenement.create({
    data: { titre, date: new Date(date), lieu: lieu || null, lien: lien || null, objectifs: objectifs || null },
  });
  return NextResponse.json(evenement, { status: 201 });
}
