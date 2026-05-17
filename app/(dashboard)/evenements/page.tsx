"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CalendarDays, MapPin, Users, Plus, ChevronRight,
  ChevronLeft, List, Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Evenement = {
  id: string;
  titre: string;
  date: string;
  lieu: string | null;
  _count: { participants: number };
};

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ── Vue Calendrier ─────────────────────────────────────────── */
function CalendarView({ evenements }: { evenements: Evenement[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay: Record<number, Evenement[]> = {};
  for (const e of evenements) {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(e);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900 text-lg min-w-[200px] text-center">
            {MONTHS_FR[month]} {year}
          </h2>
          <button
            onClick={goToday}
            className="text-xs text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50"
          >
            Aujourd'hui
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_FR.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => (
            <div
              key={i}
              className={`min-h-[90px] rounded-lg p-1.5 border transition-colors ${
                day
                  ? isToday(day)
                    ? "bg-blue-50 border-blue-300"
                    : "bg-gray-50 border-transparent hover:border-gray-200"
                  : "border-transparent"
              }`}
            >
              {day && (
                <>
                  <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full mx-auto ${
                    isToday(day)
                      ? "bg-blue-600 text-white"
                      : "text-gray-600"
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {(eventsByDay[day] || []).map((e) => {
                      const isPast = new Date(e.date) < today;
                      return (
                        <Link
                          key={e.id}
                          href={`/evenements/${e.id}`}
                          title={e.titre}
                          className={`block text-xs px-1.5 py-0.5 rounded font-medium truncate transition-colors ${
                            isPast
                              ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        >
                          {e.titre}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 inline-block" />
          À venir
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-200 inline-block" />
          Passé
        </span>
      </div>
    </div>
  );
}

/* ── Vue Liste ──────────────────────────────────────────────── */
function ListView({ evenements }: { evenements: Evenement[] }) {
  const now = new Date();
  const aVenir = evenements.filter((e) => new Date(e.date) >= now);
  const passes = evenements.filter((e) => new Date(e.date) < now);

  function EvenementCard({ e }: { e: Evenement }) {
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
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
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

  if (evenements.length === 0) return null;

  return (
    <div className="space-y-6">
      {aVenir.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            À venir — {aVenir.length}
          </h2>
          {aVenir.map((e) => <EvenementCard key={e.id} e={e} />)}
        </div>
      )}
      {passes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Passés — {passes.length}
          </h2>
          {[...passes].reverse().map((e) => <EvenementCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}

/* ── Page principale ────────────────────────────────────────── */
export default function EvenementsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;

  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState<"liste" | "calendrier">("calendrier");

  useEffect(() => {
    fetch("/api/evenements")
      .then((r) => r.json())
      .then((d) => { setEvenements(d); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
        <div className="flex items-center gap-2">
          {/* Toggle vue */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setVue("calendrier")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vue === "calendrier" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar size={15} />
              Calendrier
            </button>
            <button
              onClick={() => setVue("liste")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vue === "liste" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List size={15} />
              Liste
            </button>
          </div>
          {/* Bouton créer — accessible à tous */}
          {role && (
            <Link
              href="/evenements/nouveau"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Nouvel événement
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
      ) : evenements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun événement pour le moment.</p>
          <Link href="/evenements/nouveau" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Déclarer le premier événement
          </Link>
        </div>
      ) : vue === "calendrier" ? (
        <CalendarView evenements={evenements} />
      ) : (
        <ListView evenements={evenements} />
      )}
    </div>
  );
}
