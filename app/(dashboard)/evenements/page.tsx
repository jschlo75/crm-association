import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CalendarDays, MapPin, Users, Plus, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function EvenementsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;

  const evenements = await prisma.evenement.findMany({
    orderBy: { date: "asc" },
    include: { _count: { select: { participants: true } } },
  });

  const now = new Date();
  const aVenir = evenements.filter((e) => new Date(e.date) >= now);
  const passes = evenements.filter((e) => new Date(e.date) < now);

  function EvenementCard({ e }: { e: (typeof evenements)[0] }) {
    const isPast = new Date(e.date) < now;
    return (
      <Link
        href={`/evenements/${e.id}`}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all flex items-start justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? "bg-gray-100" : "bg-blue-100"}`}>
            <CalendarDays size={22} className={isPast ? "text-gray-400" : "text-blue-600"} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{e.titre}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays size={13} />
                {formatDate(e.date)}
              </span>
              {e.lieu && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {e.lieu}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={13} />
                {e._count.participants} participant{e._count.participants > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
      </Link>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
        {role === "ADMIN" && (
          <Link
            href="/evenements/nouveau"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouvel événement
          </Link>
        )}
      </div>

      {evenements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun événement pour le moment.</p>
          {role === "ADMIN" && (
            <Link href="/evenements/nouveau" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              Créer le premier événement
            </Link>
          )}
        </div>
      ) : (
        <>
          {aVenir.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">À venir — {aVenir.length}</h2>
              {aVenir.map((e) => <EvenementCard key={e.id} e={e} />)}
            </div>
          )}
          {passes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Passés — {passes.length}</h2>
              {[...passes].reverse().map((e) => <EvenementCard key={e.id} e={e} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
