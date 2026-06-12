import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  prenom: z.string().optional(),
  nom: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MEMBRE", "RESTREINT"]),
});

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const where = q
    ? { OR: [{ nom: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] }
    : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { nom: "asc" },
      skip,
      take: limit,
      select: { id: true, prenom: true, nom: true, email: true, role: true, actif: true, createdAt: true, organisation: { select: { id: true, nom: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ data: users, total, pages: Math.ceil(total / limit), page });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { password, ...rest } = parsed.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email: rest.email } });
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });

  const user = await prisma.user.create({
    data: { ...rest, password: hashedPassword },
    select: { id: true, prenom: true, nom: true, email: true, role: true, actif: true, createdAt: true, organisation: { select: { id: true, nom: true } } },
  });

  return NextResponse.json(user, { status: 201 });
}
