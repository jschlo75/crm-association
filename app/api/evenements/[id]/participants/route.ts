import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id: evenementId } = await params;
  const { contactId, statut } = await req.json();
  if (!contactId) return NextResponse.json({ error: "contactId obligatoire" }, { status: 400 });

  const participant = await prisma.evenementParticipant.create({
    data: {
      evenementId,
      contactId,
      statut: statut || "CIBLE",
    },
    include: { contact: { include: { organisation: true } } },
  });
  return NextResponse.json(participant, { status: 201 });
}
