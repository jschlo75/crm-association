import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, Target, Pencil, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ParticipantManager } from "@/components/ui/participant-manager";
import { DeleteEvenementButton } from "./delete-button";

export default async function EvenementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  const { id } = await params;

  const [evenement, allContacts] = await Promise.all([
    prisma.evenement.findUnique({
      where: { id },
      include: {
        participants: {
          include: { contact: { include: { organisation: true } } },
          orderBy: { contact: { nom: "asc" } },
        },
      },
    }),
    prisma.contact.findMany({
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      include: { organisation: true },
    }),
  ]);

  if (!evenement) notFound();

  const isPast = new Date(evenement.date) < new Date();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? "bg-gray-100" : "bg-blue-100"}`}>
            <CalendarDays size={28} className={isPast ? "text-gray-400" : "text-blue-600"} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{evenement.titre}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                {formatDateTime(evenement.date)}
              </span>
              {evenement.lieu && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {evenement.lieu}
                </span>
              )}
            </div>
          </div>
        </div>
        {role === "ADMIN" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/evenements/${id}/modifier`}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Pencil size={15} />
              Modifier
            </Link>
            <DeleteEvenementButton id={id} />
          </div>
        )}
      </div>

      {/* Objectifs */}
      {evenement.objectifs && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Target size={16} className="text-gray-400" />
            Objectifs
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{evenement.objectifs}</p>
        </div>
      )}

      {/* Participants */}
      <ParticipantManager
        evenementId={id}
        initialParticipants={evenement.participants.map((p) => ({
          id: p.id,
          statut: p.statut as "CIBLE" | "INVITE" | "A_ACCEPTE" | "A_PARTICIPE" | "A_REFUSE",
          contact: {
            id: p.contact.id,
            prenom: p.contact.prenom,
            nom: p.contact.nom,
            poste: p.contact.poste,
            organisation: p.contact.organisation ? { id: p.contact.organisation.id, nom: p.contact.organisation.nom } : null,
          },
        }))}
        allContacts={allContacts.map((c) => ({
          id: c.id,
          prenom: c.prenom,
          nom: c.nom,
          poste: c.poste,
          organisation: c.organisation ? { id: c.organisation.id, nom: c.organisation.nom } : null,
        }))}
        isAdmin={role === "ADMIN"}
      />
    </div>
  );
}
