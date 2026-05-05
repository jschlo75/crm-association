import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MEMBRE"]).optional(),
  actif: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, nom: true, email: true, role: true, actif: true },
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
