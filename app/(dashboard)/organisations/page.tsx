"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Building2, Plus, Search, ChevronRight, ChevronLeft, Filter, X, BadgeCheck } from "lucide-react";
import { TYPE_ORGANISATION_LABELS } from "@/lib/utils";

type Organisation = {
  id: string;
  nom: string;
  type: string | null;
  membreSnhf: boolean;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  _count: { contacts: number; interactions: number };
};

const TYPES = [
  { value: "ENSEIGNEMENT",     label: "Enseignement" },
  { value: "ASSOCIATION",      label: "Association" },
  { value: "FEDERATION",       label: "Fédération" },
  { value: "JARDIN_PRIVE",     label: "Jardin privé" },
  { value: "ORGANISME_PUBLIC", label: "Organisme public" },
];

const LIMIT = 50;

function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-400">
        Page {page} / {pages} — {total} organisation{total > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} />
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button key={n} onClick={() => onPage(n as number)} className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
              {n}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function OrganisationsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [search, setSearch] = useState("");
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterMembre, setFilterMembre] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const activeFilterCount = filterTypes.length + (filterMembre ? 1 : 0);

  const fetchOrganisations = useCallback((p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (search) params.set("q", search);
    filterTypes.forEach((t) => params.append("type", t));
    if (filterMembre) params.set("membreSnhf", "true");

    fetch(`/api/organisations?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setOrganisations(res.data ?? []);
        setTotal(res.total ?? 0);
        setPages(res.pages ?? 1);
        setLoading(false);
      });
  }, [search, filterTypes, filterMembre]);

  // Reset page et fetch quand search/filtres changent
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchOrganisations(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOrganisations]);

  // Fetch quand page change
  useEffect(() => {
    fetchOrganisations(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function toggleType(value: string) {
    setFilterTypes((prev) => prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]);
  }

  function resetFilters() { setFilterTypes([]); setFilterMembre(false); }

  function handlePage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
          {!loading && <p className="text-sm text-gray-500 mt-0.5">{total} organisation{total > 1 ? "s" : ""}</p>}
        </div>
        {role === "ADMIN" && (
          <Link href="/organisations/nouveau" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Nouvelle organisation
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters || activeFilterCount > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}`}
        >
          <Filter size={15} />
          Filtres
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Filtres</span>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <X size={12} />Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button key={t.value} onClick={() => toggleType(t.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterTypes.includes(t.value) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Adhésion</label>
              <button onClick={() => setFilterMembre((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterMembre ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"}`}>
                <BadgeCheck size={13} />Membres SNHF uniquement
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFilterCount > 0 && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Filtres actifs :</span>
          {filterTypes.map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              {TYPE_ORGANISATION_LABELS[t]}
              <button onClick={() => toggleType(t)} className="hover:text-red-500"><X size={10} /></button>
            </span>
          ))}
          {filterMembre && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              Membres SNHF
              <button onClick={() => setFilterMembre(false)} className="hover:text-red-500"><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : organisations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {search || activeFilterCount > 0 ? "Aucune organisation ne correspond à ces critères." : "Aucune organisation pour le moment."}
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-gray-100 text-xs text-gray-400">
              {total} organisation{total > 1 ? "s" : ""}
            </div>
            <ul className="divide-y divide-gray-100">
              {organisations.map((org) => (
                <li key={org.id}>
                  <Link href={`/organisations/${org.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{org.nom}</span>
                        {org.type && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{TYPE_ORGANISATION_LABELS[org.type]}</span>}
                        {org.membreSnhf && (
                          <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            <BadgeCheck size={11} />Membre SNHF
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
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={pages} total={total} onPage={handlePage} />
          </>
        )}
      </div>
    </div>
  );
}
