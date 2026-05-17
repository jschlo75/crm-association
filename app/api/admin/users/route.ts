import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
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

  const users = await prisma.user.findMany({
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, email: true, role: true, actif: true, createdAt: true },
  });

  return NextResponse.json(users);
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
    select: { id: true, nom: true, email: true, role: true, actif: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
