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
  membreSnhf: z.boolean().optional(),
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
  const q              = searchParams.get("q") || "";
  const types          = searchParams.getAll("type").filter(Boolean);
  const membreSnhf     = searchParams.get("membreSnhf");
  const organisationId = searchParams.get("organisationId") || "";
  const page           = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit          = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));

  const where: Record<string, unknown> = {};
  if (q) where.nom = { contains: q, mode: "insensitive" };
  if (types.length === 1) where.type = types[0];
  else if (types.length > 1) where.type = { in: types };
  if (membreSnhf === "true") where.membreSnhf = true;
  if (organisationId) where.id = organisationId;

  const whereClause = Object.keys(where).length ? where : undefined;

  const [total, organisations] = await Promise.all([
    prisma.organisation.count({ where: whereClause }),
    prisma.organisation.findMany({
      where: whereClause,
      orderBy: { nom: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { contacts: true, interactions: true } } },
    }),
  ]);

  return NextResponse.json({ data: organisations, total, page, pages: Math.ceil(total / limit) });
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
