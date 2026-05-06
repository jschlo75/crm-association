"use client";

import { useState, useMemo } from "react";
import { UserPlus, X, Search } from "lucide-react";
import { STATUT_PARTICIPANT_LABELS, STATUT_PARTICIPANT_COLORS } from "@/lib/utils";

type StatutParticipant = "CIBLE" | "INVITE" | "A_ACCEPTE" | "A_PARTICIPE" | "A_REFUSE";

type Contact = {
  id: string;
  prenom: string;
  nom: string;
  poste?: string | null;
  compte?: { id: string; nom: string } | null;
};

type Participant = {
  id: string;
  statut: StatutParticipant;
  contact: Contact;
};

const STATUTS = Object.keys(STATUT_PARTICIPANT_LABELS) as StatutParticipant[];

export function ParticipantManager({
  evenementId,
  initialParticipants,
  allContacts,
  isAdmin,
}: {
  evenementId: string;
  initialParticipants: Participant[];
  allContacts: Contact[];
  isAdmin: boolean;
}) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Contacts not yet added
  const addedIds = new Set(participants.map((p) => p.contact.id));
  const availableContacts = useMemo(
    () =>
      allContacts.filter(
        (c) =>
          !addedIds.has(c.id) &&
          (search === "" ||
            `${c.prenom} ${c.nom} ${c.compte?.nom ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      ),
    [allContacts, addedIds, search]
  );

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUTS) counts[s] = 0;
    for (const p of participants) counts[p.statut] = (counts[p.statut] || 0) + 1;
    return counts;
  }, [participants]);

  async function handleStatutChange(participantId: string, statut: StatutParticipant) {
    setLoadingId(participantId);
    const res = await fetch(
      `/api/evenements/${evenementId}/participants/${participantId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      }
    );
    if (res.ok) {
      const updated = await res.json();
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, statut: updated.statut } : p))
      );
    }
    setLoadingId(null);
  }

  async function handleRemove(participantId: string) {
    if (!confirm("Retirer ce participant ?")) return;
    setLoadingId(participantId);
    const res = await fetch(
      `/api/evenements/${evenementId}/participants/${participantId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    }
    setLoadingId(null);
  }

  async function handleAdd(contact: Contact) {
    const res = await fetch(`/api/evenements/${evenementId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: contact.id, statut: "CIBLE" }),
    });
    if (res.ok) {
      const participant = await res.json();
      setParticipants((prev) => [...prev, participant]);
      setSearch("");
    }
  }

  return (
    <div className="space-y-4">
      {/* Compteurs par statut */}
      <div className="grid grid-cols-5 gap-2">
        {STATUTS.map((s) => (
          <div key={s} className={`rounded-lg px-3 py-2 text-center ${STATUT_PARTICIPANT_COLORS[s]}`}>
            <div className="text-xl font-bold">{stats[s]}</div>
            <div className="text-xs mt-0.5">{STATUT_PARTICIPANT_LABELS[s]}</div>
          </div>
        ))}
      </div>

      {/* Liste des participants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900 text-sm">
            {participants.length} participant{participants.length > 1 ? "s" : ""}
          </span>
          {isAdmin && (
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <UserPlus size={15} />
              Ajouter
            </button>
          )}
        </div>

        {/* Panneau d'ajout */}
        {isAdmin && showAdd && (
          <div className="border-b border-gray-100 px-6 py-4 bg-blue-50 space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un contact..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {search.length > 0 && (
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white rounded-lg border border-gray-200">
                {availableContacts.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-400">Aucun contact trouvé</li>
                ) : (
                  availableContacts.slice(0, 20).map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => handleAdd(c)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">{c.prenom} {c.nom}</span>
                          {c.poste && <span className="text-xs text-gray-500 ml-2">{c.poste}</span>}
                        </div>
                        {c.compte && (
                          <span className="text-xs text-gray-400">{c.compte.nom}</span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}

        {/* Table des participants */}
        {participants.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">
            Aucun participant. Cliquez sur &quot;Ajouter&quot; pour commencer.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Compte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
                {isAdmin && <th className="px-6 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                        {p.contact.prenom[0]}{p.contact.nom[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{p.contact.prenom} {p.contact.nom}</div>
                        {p.contact.poste && <div className="text-xs text-gray-500">{p.contact.poste}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {p.contact.compte?.nom ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {isAdmin ? (
                      <select
                        value={p.statut}
                        disabled={loadingId === p.id}
                        onChange={(e) => handleStatutChange(p.id, e.target.value as StatutParticipant)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUT_PARTICIPANT_COLORS[p.statut]}`}
                      >
                        {STATUTS.map((s) => (
                          <option key={s} value={s}>{STATUT_PARTICIPANT_LABELS[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_PARTICIPANT_COLORS[p.statut]}`}>
                        {STATUT_PARTICIPANT_LABELS[p.statut]}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemove(p.id)}
                        disabled={loadingId === p.id}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Retirer"
                      >
                        <X size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
