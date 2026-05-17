import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { participantId } = await params;
  const { statut } = await req.json();

  const participant = await prisma.evenementParticipant.update({
    where: { id: participantId },
    data: { statut },
    include: { contact: { include: { organisation: true } } },
  });
  return NextResponse.json(participant);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { participantId } = await params;
  await prisma.evenementParticipant.delete({ where: { id: participantId } });
  return NextResponse.json({ ok: true });
}
