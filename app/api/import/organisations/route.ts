import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Accepte les libellés affichés ET les clés internes (insensible à la casse)
const TYPE_MAP: Record<string, string> = {
  enseignement:      "ENSEIGNEMENT",
  association:       "ASSOCIATION",
  "fédération":      "FEDERATION",
  "federation":      "FEDERATION",
  "jardin privé":    "JARDIN_PRIVE",
  "jardin prive":    "JARDIN_PRIVE",
  "organisme public":"ORGANISME_PUBLIC",
};

function normalizeType(val: unknown): unknown {
  if (typeof val !== "string" || val.trim() === "") return undefined;
  const lower = val.trim().toLowerCase();
  // Libellé reconnu → clé interne
  if (TYPE_MAP[lower]) return TYPE_MAP[lower];
  // Déjà une clé interne valide → passe tel quel pour Zod
  return val.trim().toUpperCase();
}

const rowSchema = z.object({
  nom: z.string().min(1),
  type: z.preprocess(normalizeType, z.enum(["ENSEIGNEMENT", "ASSOCIATION", "FEDERATION", "JARDIN_PRIVE", "ORGANISME_PUBLIC"]).optional()),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  telephone: z.string().optional().or(z.null()),
  siteWeb: z.string().optional().or(z.null()),
  adresse: z.string().optional().or(z.null()),
  codePostal: z.string().optional().or(z.null()),
  ville: z.string().optional().or(z.null()),
  pays: z.string().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
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

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push(`Ligne ${i + 2} : ${parsed.error.issues.map((e) => e.message).join(", ")}`);
      continue;
    }

    const { email, ...rest } = parsed.data;

    try {
      const existing = await prisma.organisation.findFirst({
        where: { nom: { equals: rest.nom, mode: "insensitive" } },
      });

      if (existing) {
        await prisma.organisation.update({
          where: { id: existing.id },
          data: {
            ...rest,
            type: rest.type ?? existing.type ?? null,
            email: email || existing.email,
            pays: rest.pays || existing.pays,
          },
        });
        updated++;
      } else {
        await prisma.organisation.create({
          data: {
            ...rest,
            type: rest.type ?? null,
            email: email || null,
            pays: rest.pays || "France",
          },
        });
        created++;
      }
    } catch {
      errors.push(`Ligne ${i + 2} (${rest.nom}) : erreur base de données`);
    }
  }

  return NextResponse.json({ created, updated, errors });
}
