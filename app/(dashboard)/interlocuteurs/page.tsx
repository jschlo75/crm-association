"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle, ChevronLeft, ChevronRight, Building2, Mail } from "lucide-react";

type Interlocuteur = {
  id: string;
  prenom: string | null;
  nom: string;
  email: string;
  organisation: { id: string; nom: string } | null;
};

const LIMIT = 20;

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
        Page {page} / {pages} — {total} interlocuteur{total > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} />
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}
            >
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

export default function InterlocuteursPage() {
  const [interlocuteurs, setInterlocuteurs] = useState<Interlocuteur[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchInterlocuteurs = useCallback((q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (q) params.set("q", q);
    fetch(`/api/interlocuteurs?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setInterlocuteurs(res.data ?? []);
        setTotal(res.total ?? 0);
        setPages(res.pages ?? 1);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchInterlocuteurs("", 1);
  }, [fetchInterlocuteurs]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchInterlocuteurs(search, 1); }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchInterlocuteurs]);

  useEffect(() => {
    fetchInterlocuteurs(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interlocuteurs</h1>
          {!loading && <p className="text-sm text-gray-500 mt-0.5">{total} interlocuteur{total > 1 ? "s" : ""}</p>}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un interlocuteur (nom, prénom, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : interlocuteurs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {search ? "Aucun interlocuteur trouvé." : "Aucun interlocuteur pour le moment."}
          </div>
        ) : (
          <>
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Interlocuteur</th>
                  <th className="px-6 py-3">Organisation</th>
                  <th className="px-6 py-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interlocuteurs.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {u.prenom ? u.prenom[0] : u.nom[0]}
                        </div>
                        <span className="font-medium text-gray-900">
                          {[u.prenom, u.nom].filter(Boolean).join(" ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.organisation ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                          {u.organisation.nom}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.email ? (
                        <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                          <Mail size={13} className="flex-shrink-0" />
                          {u.email}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pages={pages} total={total} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </>
        )}
      </div>
    </div>
  );
}
