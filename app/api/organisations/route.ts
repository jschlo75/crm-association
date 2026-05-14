import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const organisationSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(["ENSEIGNEMENT", "ASSOCIATION", "FEDERATION", "JARDIN_PRIVE", "ORGANISME_PUBLIC"]).optional().nullable(),
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const organisations = await prisma.organisation.findMany({
    where: q ? { nom: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { nom: "asc" },
    include: { _count: { select: { contacts: true, interactions: true } } },
  });

  return NextResponse.json(organisations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const parsed = organisationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email, siteWeb, parentId, ...rest } = parsed.data;
  const organisation = await prisma.organisation.create({
    data: {
      ...rest,
      email: email || null,
      siteWeb: siteWeb || null,
      parentId: parentId || null,
    },
  });

  return NextResponse.json(organisation, { status: 201 });
}
