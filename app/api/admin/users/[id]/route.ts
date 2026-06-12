import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  prenom: z.string().optional().nullable(),
  nom: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MEMBRE", "RESTREINT"]).optional(),
  actif: z.boolean().optional(),
  organisationId: z.string().optional().nullable(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN") return null;
  return session;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, prenom: true, nom: true, email: true, role: true, actif: true,
      consentementPartageContacts: true, consentementEmailsInfo: true, consentementMisAJourLe: true,
      organisationId: true,
      organisation: { select: { id: true, nom: true } },
      createdAt: true, updatedAt: true,
      connexions: { orderBy: { createdAt: "desc" }, take: 10, select: { createdAt: true, role: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { organisationId, ...rest } = parsed.data;
  const user = await prisma.user.update({
    where: { id },
    data: { ...rest, organisationId: organisationId ?? undefined },
    select: { id: true, nom: true, email: true, role: true, actif: true, organisationId: true, organisation: { select: { id: true, nom: true } } },
  });

  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const currentUserId = (session.user as { id: string }).id;
  const { id } = await params;

  if (id === currentUserId)
    return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer." }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
