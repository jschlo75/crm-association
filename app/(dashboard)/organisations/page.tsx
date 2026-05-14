"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Building2, Plus, Search, ChevronRight } from "lucide-react";
import { TYPE_ORGANISATION_LABELS } from "@/lib/utils";

type Organisation = {
  id: string;
  nom: string;
  type: string;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  _count: { contacts: number; interactions: number };
};

export default function OrganisationsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/organisations?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data) => { setOrganisations(data); setLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
        {role === "ADMIN" && (
          <Link
            href="/organisations/nouveau"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouvelle organisation
          </Link>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une organisation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : organisations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {search ? "Aucune organisation trouvée." : "Aucune organisation pour le moment."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {organisations.map((org) => (
              <li key={org.id}>
                <Link
                  href={`/organisations/${org.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{org.nom}</span>
                      {org.type && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {TYPE_ORGANISATION_LABELS[org.type]}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
                      {org.ville && <span>{org.ville}</span>}
                      {org.email && <span>{org.email}</span>}
                      <span>{org._count.contacts} contact{org._count.contacts > 1 ? "s" : ""}</span>
                      <span>{org._count.interactions} interaction{org._count.interactions > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
