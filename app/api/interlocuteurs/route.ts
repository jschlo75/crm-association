import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const where = {
    consentementPartageContacts: true,
    actif: true,
    ...(q ? { OR: [
      { nom: { contains: q, mode: "insensitive" as const } },
      { prenom: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
    ]} : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { nom: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        organisation: { select: { id: true, nom: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ data: users, total, pages: Math.ceil(total / limit), page });
}
