import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  poste: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  notes: z.string().optional(),
  organisationId: z.string().optional().or(z.literal("")),
  isMembre: z.boolean().optional(),
  dateAdhesion: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const contacts = await prisma.contact.findMany({
    where: q
      ? {
          OR: [
            { nom: { contains: q, mode: "insensitive" } },
            { prenom: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    include: {
      organisation: { select: { id: true, nom: true } },
      _count: { select: { interactions: true } },
    },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { email, organisationId, isMembre, dateAdhesion, ...rest } = parsed.data;
  const contact = await prisma.contact.create({
    data: {
      ...rest,
      email: email || null,
      organisationId: organisationId || null,
      isMembre: isMembre ?? false,
      dateAdhesion: dateAdhesion ? new Date(dateAdhesion) : null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
