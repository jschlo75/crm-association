import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rowSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  poste: z.string().optional().or(z.null()),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  telephone: z.string().optional().or(z.null()),
  adresse: z.string().optional().or(z.null()),
  codePostal: z.string().optional().or(z.null()),
  ville: z.string().optional().or(z.null()),
  pays: z.string().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
  organisation: z.string().optional().or(z.null()),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const rows: unknown[] = body.rows ?? [];

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  // Cache des organisations pour éviter N+1 queries
  const organisationCache = new Map<string, string>();

  async function findOrganisationId(nomOrg: string): Promise<string | null> {
    const key = nomOrg.toLowerCase();
    if (organisationCache.has(key)) return organisationCache.get(key)!;
    const o = await prisma.organisation.findFirst({
      where: { nom: { equals: nomOrg, mode: "insensitive" } },
      select: { id: true },
    });
    if (o) organisationCache.set(key, o.id);
    return o?.id ?? null;
  }

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push(`Ligne ${i + 2} : ${parsed.error.issues.map((e) => e.message).join(", ")}`);
      continue;
    }

    const { email, organisation: nomOrg, ...rest } = parsed.data;

    let organisationId: string | null = null;
    if (nomOrg) {
      organisationId = await findOrganisationId(nomOrg);
      if (!organisationId) {
        errors.push(`Ligne ${i + 2} (${rest.prenom} ${rest.nom}) : organisation "${nomOrg}" introuvable, contact importé sans rattachement`);
      }
    }

    try {
      const existing = await prisma.contact.findFirst({
        where: {
          nom: { equals: rest.nom, mode: "insensitive" },
          prenom: { equals: rest.prenom, mode: "insensitive" },
        },
      });

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            ...rest,
            email: email || existing.email,
            organisationId: organisationId ?? existing.organisationId,
            pays: rest.pays || existing.pays,
          },
        });
        updated++;
      } else {
        await prisma.contact.create({
          data: {
            ...rest,
            email: email || null,
            organisationId,
            pays: rest.pays || "France",
          },
        });
        created++;
      }
    } catch {
      errors.push(`Ligne ${i + 2} (${rest.prenom} ${rest.nom}) : erreur base de données`);
    }
  }

  return NextResponse.json({ created, updated, errors });
}
