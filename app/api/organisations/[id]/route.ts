import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const organisationSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(["ENSEIGNEMENT", "ASSOCIATION", "FEDERATION", "JARDIN_PRIVE", "ORGANISME_PUBLIC"]),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  siteWeb: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  notes: z.string().optional(),
  parentId: z.string().optional().or(z.literal("")),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const organisation = await prisma.organisation.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { nom: "asc" } },
      interactions: {
        orderBy: { date: "desc" },
        include: { contact: true, user: true },
      },
    },
  });

  if (!organisation) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(organisation);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = organisationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email, siteWeb, parentId, ...rest } = parsed.data;
  if (parentId && parentId === id) {
    return NextResponse.json({ error: "Une organisation ne peut pas être sa propre parente" }, { status: 400 });
  }
  const organisation = await prisma.organisation.update({
    where: { id },
    data: { ...rest, email: email || null, siteWeb: siteWeb || null, parentId: parentId || null },
  });

  return NextResponse.json(organisation);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  await prisma.organisation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
