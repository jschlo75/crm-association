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

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const verger = await prisma.verger.findUnique({
    where: { id },
    include: {
      responsableOrganisation: { select: { id: true, nom: true } },
      responsableContact: { select: { id: true, prenom: true, nom: true } },
    },
  });
  if (!verger) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(verger);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = vergerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const d = parsed.data;
  const prismaData = {
    nom:                       d.nom,
    adresse:                   d.adresse                   ?? null,
    codePostal:                d.codePostal                ?? null,
    ville:                     d.ville                     ?? null,
    pays:                      d.pays                      ?? "France",
    responsableType:           d.responsableType           ?? null,
    responsableOrganisationId: d.responsableType === "ORGANISATION" ? (d.responsableOrganisationId ?? null) : null,
    responsableContactId:      d.responsableType === "CONTACT"      ? (d.responsableContactId      ?? null) : null,
    nbArbres:                  d.nbArbres                  ?? null,
    especesVarietes:           d.especesVarietes           ?? null,
    formesEspalier:            d.formesEspalier            ?? null,
    notes:                     d.notes                     ?? null,
  };

  const verger = await prisma.verger.update({ where: { id }, data: prismaData });
  return NextResponse.json(verger);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  await prisma.verger.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
