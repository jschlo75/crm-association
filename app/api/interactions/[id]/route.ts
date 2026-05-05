import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const interactionSchema = z.object({
  date: z.string().min(1),
  type: z.enum(["APPEL", "EMAIL", "REUNION"]),
  sujet: z.string().min(1),
  description: z.string().optional(),
  compteId: z.string().optional().or(z.literal("")),
  contactId: z.string().optional().or(z.literal("")),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  const { id } = await params;

  const existing = await prisma.interaction.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (role !== "ADMIN" && existing.userId !== userId)
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const parsed = interactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { date, compteId, contactId, ...rest } = parsed.data;
  const interaction = await prisma.interaction.update({
    where: { id },
    data: {
      ...rest,
      date: new Date(date),
      compteId: compteId || null,
      contactId: contactId || null,
    },
  });

  return NextResponse.json(interaction);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  const { id } = await params;

  const existing = await prisma.interaction.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (role !== "ADMIN" && existing.userId !== userId)
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  await prisma.interaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
