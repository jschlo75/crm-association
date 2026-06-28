import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const arbreSchema = z.object({
  espece: z.string().min(1),
  nbArbres: z.number().int().nonnegative().optional().nullable(),
  varietes: z.string().optional().nullable(),
  formes: z.string().optional().nullable(),
  ageMoyen: z.number().int().nonnegative().optional().nullable(),
  ordre: z.number().int().optional(),
});

const vergerSchema = z.object({
  nom: z.string().min(1),
  adresse: z.string().optional().nullable(),
  codePostal: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  pays: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  proprietaire: z.string().optional().nullable(),
  exploitant: z.string().optional().nullable(),
  ouvertPublic: z.boolean().optional(),
  superficie: z.number().optional().nullable(),
  sol: z.string().optional().nullable(),
  ph: z.number().optional().nullable(),
  pluviometrie: z.number().optional().nullable(),
  moisDeficit: z.string().optional().nullable(),
  responsableType: z.enum(["ORGANISATION", "CONTACT"]).optional().nullable(),
  responsableOrganisationId: z.string().optional().nullable(),
  responsableContactId: z.string().optional().nullable(),
  anneeCreation: z.number().int().optional().nullable(),
  anneeConversion: z.number().int().optional().nullable(),
  certifications: z.string().optional().nullable(),
  objectifs: z.string().optional().nullable(),
  personnelEmployes: z.string().optional().nullable(),
  personnelBenevoles: z.string().optional().nullable(),
  activitesFormation: z.string().optional().nullable(),
  autresActivites: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  arbres: z.array(arbreSchema).optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || !["ADMIN", "RESTREINT"].includes(role))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const verger = await prisma.verger.findUnique({
    where: { id },
    include: {
      responsableOrganisation: { select: { id: true, nom: true } },
      responsableContact: { select: { id: true, prenom: true, nom: true } },
      arbres: { orderBy: { ordre: "asc" } },
    },
  });
  if (!verger) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(verger);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || !["ADMIN", "RESTREINT"].includes(role))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = vergerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const d = parsed.data;

  const verger = await prisma.verger.update({
    where: { id },
    data: {
      nom: d.nom,
      adresse: d.adresse ?? null,
      codePostal: d.codePostal ?? null,
      ville: d.ville ?? null,
      pays: d.pays ?? "France",
      contact: d.contact ?? null,
      proprietaire: d.proprietaire ?? null,
      exploitant: d.exploitant ?? null,
      ouvertPublic: d.ouvertPublic ?? false,
      superficie: d.superficie ?? null,
      sol: d.sol ?? null,
      ph: d.ph ?? null,
      pluviometrie: d.pluviometrie ?? null,
      moisDeficit: d.moisDeficit ?? null,
      responsableType: d.responsableType ?? null,
      responsableOrganisationId: d.responsableType === "ORGANISATION" ? (d.responsableOrganisationId ?? null) : null,
      responsableContactId: d.responsableType === "CONTACT" ? (d.responsableContactId ?? null) : null,
      anneeCreation: d.anneeCreation ?? null,
      anneeConversion: d.anneeConversion ?? null,
      certifications: d.certifications ?? null,
      objectifs: d.objectifs ?? null,
      personnelEmployes: d.personnelEmployes ?? null,
      personnelBenevoles: d.personnelBenevoles ?? null,
      activitesFormation: d.activitesFormation ?? null,
      autresActivites: d.autresActivites ?? null,
      notes: d.notes ?? null,
      arbres: d.arbres !== undefined ? {
        deleteMany: {},
        create: d.arbres.map((a, i) => ({ ...a, ordre: a.ordre ?? i })),
      } : undefined,
    },
  });
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
