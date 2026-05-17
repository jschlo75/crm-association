import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: {
      participants: {
        include: { contact: { include: { organisation: true } } },
        orderBy: { contact: { nom: "asc" } },
      },
    },
  });
  if (!evenement) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(evenement);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const { titre, date, lieu, lien, objectifs } = await req.json();

  const evenement = await prisma.evenement.update({
    where: { id },
    data: { titre, date: new Date(date), lieu: lieu || null, lien: lien || null, objectifs: objectifs || null },
  });
  return NextResponse.json(evenement);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  await prisma.evenement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
