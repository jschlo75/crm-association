import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rowSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(["ENTREPRISE", "ASSOCIATION", "COLLECTIVITE", "PARTICULIER", "AUTRE"]).optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  telephone: z.string().optional().or(z.null()),
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
      // Upsert : si un compte avec le même nom existe déjà, on le met à jour
      const existing = await prisma.compte.findFirst({
        where: { nom: { equals: rest.nom, mode: "insensitive" } },
      });

      if (existing) {
        await prisma.compte.update({
          where: { id: existing.id },
          data: {
            ...rest,
            type: rest.type ?? existing.type,
            email: email || existing.email,
            pays: rest.pays || existing.pays,
          },
        });
        updated++;
      } else {
        await prisma.compte.create({
          data: {
            ...rest,
            type: rest.type ?? "AUTRE",
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
