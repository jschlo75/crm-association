import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const compteSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(["ENTREPRISE", "ASSOCIATION", "COLLECTIVITE", "PARTICULIER", "AUTRE"]),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const compte = await prisma.compte.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { nom: "asc" } },
      interactions: {
        orderBy: { date: "desc" },
        include: { contact: true, user: true },
      },
    },
  });

  if (!compte) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(compte);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = compteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const data = parsed.data;
  const compte = await prisma.compte.update({
    where: { id },
    data: { ...data, email: data.email || null },
  });

  return NextResponse.json(compte);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  await prisma.compte.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
