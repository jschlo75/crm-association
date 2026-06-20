import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  prenom: z.string().optional().nullable(),
  nom: z.string().min(1),
  organisationId: z.string().optional().nullable(),
  consentementPartageContacts: z.boolean(),
  consentementEmailsInfo: z.boolean(),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { prenom, nom, organisationId, consentementPartageContacts, consentementEmailsInfo } = parsed.data;

  await prisma.user.update({
    where: { id: userId },
    data: {
      prenom: prenom || null,
      nom,
      organisationId: organisationId || null,
      consentementPartageContacts,
      consentementEmailsInfo,
      consentementMisAJourLe: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
