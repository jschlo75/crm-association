"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Tractor, Plus, Search, MapPin, Leaf } from "lucide-react";

type Verger = {
  id: string;
  nom: string;
  codePostal?: string | null;
  ville?: string | null;
  proprietaire?: string | null;
  responsableType?: string | null;
  responsableOrganisation?: { id: string; nom: string } | null;
  responsableContact?: { id: string; prenom: string; nom: string } | null;
};

export default function VergersPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role: string })?.role;

  const [vergers, setVergers] = useState<Verger[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const fetchVergers = useCallback(async (query: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const res = await fetch(`/api/vergers?${params}`);
    const data = await res.json();
    setVergers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (["ADMIN", "RESTREINT"].includes(role)) fetchVergers(q);
  }, [status, role, q, fetchVergers]);

  if (status === "loading") return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Leaf size={22} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vergers</h1>
            <p className="text-sm text-gray-500">{vergers.length} verger{vergers.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        {role === "ADMIN" && (
          <Link
            href="/vergers/nouveau"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouveau verger
          </Link>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un verger..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Chargement...</div>
      ) : vergers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Leaf size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun verger enregistré.</p>
          {role === "ADMIN" && (
            <Link href="/vergers/nouveau" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Créer le premier verger
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vergers.map((v) => {
            const resp =
              v.responsableType === "ORGANISATION" && v.responsableOrganisation
                ? v.responsableOrganisation.nom
                : v.responsableType === "CONTACT" && v.responsableContact
                ? `${v.responsableContact.prenom} ${v.responsableContact.nom}`
                : null;
            return (
              <Link
                key={v.id}
                href={`/vergers/${v.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-green-300 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                    <Tractor size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate">{v.nom}</h2>
                    {(v.codePostal || v.ville) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin size={11} />
                        <span>{[v.codePostal, v.ville].filter(Boolean).join(" ")}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  {v.proprietaire && (
                    <div className="text-xs text-gray-600 truncate">Propriétaire : {v.proprietaire}</div>
                  )}
                  {resp && (
                    <div className="text-xs text-blue-600 truncate">Responsable : {resp}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
