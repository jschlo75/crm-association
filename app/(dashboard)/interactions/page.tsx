"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Search, Trash2 } from "lucide-react";
import { formatDate, TYPE_INTERACTION_LABELS, TYPE_INTERACTION_ICONS } from "@/lib/utils";

type Interaction = {
  id: string;
  date: string;
  type: string;
  sujet: string;
  description: string | null;
  organisation: { id: string; nom: string } | null;
  contact: { id: string; prenom: string; nom: string } | null;
  user: { id: string; nom: string };
};

const TYPES = [
  { value: "", label: "Tous les types" },
  { value: "APPEL", label: "Appels" },
  { value: "EMAIL", label: "Emails" },
  { value: "REUNION", label: "Réunions" },
];

export default function InteractionsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id: string })?.id;
  const role = (session?.user as { role: string })?.role;

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchInteractions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/interactions?${params}`)
      .then((r) => r.json())
      .then((data) => { setInteractions(data); setLoading(false); });
  };

  useEffect(() => {
    const timer = setTimeout(fetchInteractions, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  async function handleDelete(id: string, authorId: string) {
    if (role !== "ADMIN" && userId !== authorId) return;
    if (!confirm("Supprimer cette interaction ?")) return;
    await fetch(`/api/interactions/${id}`, { method: "DELETE" });
    setInteractions((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Interactions</h1>
        <Link
          href="/interactions/nouvelle"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nouvelle interaction
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par sujet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : interactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Aucune interaction trouvée.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {interactions.map((i) => {
              const canDelete = role === "ADMIN" || userId === i.user.id;
              return (
                <li key={i.id} className="px-6 py-4 flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{TYPE_INTERACTION_ICONS[i.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{i.sujet}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {TYPE_INTERACTION_LABELS[i.type]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{formatDate(i.date)}</span>
                      {i.contact && (
                        <>
                          <span>·</span>
                          <Link href={`/contacts/${i.contact.id}`} className="hover:text-blue-600">
                            {i.contact.prenom} {i.contact.nom}
                          </Link>
                        </>
                      )}
                      {i.organisation && (
                        <>
                          <span>·</span>
                          <Link href={`/organisations/${i.organisation.id}`} className="hover:text-blue-600">
                            {i.organisation.nom}
                          </Link>
                        </>
                      )}
                      <span>·</span>
                      <span>par {i.user.nom}</span>
                    </div>
                    {i.description && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{i.description}</p>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(i.id, i.user.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
