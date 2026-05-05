"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Building2, Plus, Search, ChevronRight } from "lucide-react";
import { TYPE_COMPTE_LABELS } from "@/lib/utils";

type Compte = {
  id: string;
  nom: string;
  type: string;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  _count: { contacts: number; interactions: number };
};

export default function ComptesPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/comptes?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data) => { setComptes(data); setLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Comptes</h1>
        {role === "ADMIN" && (
          <Link
            href="/comptes/nouveau"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouveau compte
          </Link>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un compte..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : comptes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {search ? "Aucun compte trouvé." : "Aucun compte pour le moment."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {comptes.map((compte) => (
              <li key={compte.id}>
                <Link
                  href={`/comptes/${compte.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{compte.nom}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {TYPE_COMPTE_LABELS[compte.type]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
                      {compte.ville && <span>{compte.ville}</span>}
                      {compte.email && <span>{compte.email}</span>}
                      <span>{compte._count.contacts} contact{compte._count.contacts > 1 ? "s" : ""}</span>
                      <span>{compte._count.interactions} interaction{compte._count.interactions > 1 ? "s" : ""}</span>
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
