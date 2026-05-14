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
  parentId: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const comptes = await prisma.compte.findMany({
    where: q ? { nom: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { nom: "asc" },
    include: { _count: { select: { contacts: true, interactions: true } } },
  });

  return NextResponse.json(comptes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const parsed = compteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email, parentId, ...rest } = parsed.data;
  const compte = await prisma.compte.create({
    data: {
      ...rest,
      email: email || null,
      parentId: parentId || null,
    },
  });

  return NextResponse.json(compte, { status: 201 });
}
