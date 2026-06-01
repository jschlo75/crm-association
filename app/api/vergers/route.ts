import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const vergerSchema = z.object({
  nom: z.string().min(1),
  adresse: z.string().optional().nullable(),
  codePostal: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  pays: z.string().optional().nullable(),
  responsableType: z.enum(["ORGANISATION", "CONTACT"]).optional().nullable(),
  responsableOrganisationId: z.string().optional().nullable(),
  responsableContactId: z.string().optional().nullable(),
  nbArbres: z.number().int().nonnegative().optional().nullable(),
  especesVarietes: z.string().optional().nullable(),
  formesEspalier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const vergers = await prisma.verger.findMany({
    where: q ? { nom: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { nom: "asc" },
    include: {
      responsableOrganisation: { select: { id: true, nom: true } },
      responsableContact: { select: { id: true, prenom: true, nom: true } },
    },
  });

  return NextResponse.json(vergers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const parsed = vergerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const data = parsed.data;

  // Nettoyer les relations selon le type de responsable
  if (data.responsableType === "ORGANISATION") data.responsableContactId = null;
  if (data.responsableType === "CONTACT") data.responsableOrganisationId = null;
  if (!data.responsableType) {
    data.responsableOrganisationId = null;
    data.responsableContactId = null;
  }

  const verger = await prisma.verger.create({ data });
  return NextResponse.json(verger, { status: 201 });
}
