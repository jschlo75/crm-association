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
  organisationId: z.string().optional().or(z.literal("")),
  contactId: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";

  const interactions = await prisma.interaction.findMany({
    where: {
      ...(q ? { sujet: { contains: q, mode: "insensitive" } } : {}),
      ...(type ? { type: type as "APPEL" | "EMAIL" | "REUNION" } : {}),
    },
    orderBy: { date: "desc" },
    include: {
      organisation: { select: { id: true, nom: true } },
      contact: { select: { id: true, prenom: true, nom: true } },
      user: { select: { id: true, nom: true } },
    },
  });

  return NextResponse.json(interactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const parsed = interactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { date, organisationId, contactId, ...rest } = parsed.data;
  const interaction = await prisma.interaction.create({
    data: {
      ...rest,
      date: new Date(date),
      organisationId: organisationId || null,
      contactId: contactId || null,
      userId,
    },
  });

  return NextResponse.json(interaction, { status: 201 });
}
