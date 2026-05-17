import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nom: z.string().min(1),
  sujet: z.string().min(1),
  contenu: z.string().min(1),
});

async function requireCampagneAccess() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "RESTREINT")) return null;
  return session;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const campagne = await prisma.campagne.findUnique({
    where: { id },
    include: {
      user: { select: { nom: true } },
      destinataires: { orderBy: { nom: "asc" } },
    },
  });

  if (!campagne) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(campagne);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCampagneAccess();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.campagne.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (existing.statut === "ENVOYEE")
    return NextResponse.json({ error: "Une campagne envoyée ne peut pas être modifiée." }, { status: 400 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const campagne = await prisma.campagne.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(campagne);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCampagneAccess();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  await prisma.campagne.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
