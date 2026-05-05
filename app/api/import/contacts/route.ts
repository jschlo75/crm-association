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
  compte: z.string().optional().or(z.null()),
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

  // Cache des comptes pour éviter N+1 queries
  const compteCache = new Map<string, string>();

  async function findCompteId(nomCompte: string): Promise<string | null> {
    const key = nomCompte.toLowerCase();
    if (compteCache.has(key)) return compteCache.get(key)!;
    const c = await prisma.compte.findFirst({
      where: { nom: { equals: nomCompte, mode: "insensitive" } },
      select: { id: true },
    });
    if (c) compteCache.set(key, c.id);
    return c?.id ?? null;
  }

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push(`Ligne ${i + 2} : ${parsed.error.issues.map((e) => e.message).join(", ")}`);
      continue;
    }

    const { email, compte: nomCompte, ...rest } = parsed.data;

    let compteId: string | null = null;
    if (nomCompte) {
      compteId = await findCompteId(nomCompte);
      if (!compteId) {
        errors.push(`Ligne ${i + 2} (${rest.prenom} ${rest.nom}) : compte "${nomCompte}" introuvable, contact importé sans rattachement`);
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
            compteId: compteId ?? existing.compteId,
            pays: rest.pays || existing.pays,
          },
        });
        updated++;
      } else {
        await prisma.contact.create({
          data: {
            ...rest,
            email: email || null,
            compteId,
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
