"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type LogEntry = {
  id: string;
  email: string;
  nom: string;
  role: string;
  createdAt: string;
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN:     { label: "Admin",     color: "bg-purple-100 text-purple-700" },
  MEMBRE:    { label: "Membre",    color: "bg-gray-100 text-gray-600" },
  RESTREINT: { label: "Restreint", color: "bg-amber-100 text-amber-700" },
};

export default function ConnexionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as { role: string })?.role;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && role !== "ADMIN") router.push("/dashboard");
  }, [session, role, router]);

  function fetchLogs(p: number) {
    setLoading(true);
    fetch(`/api/admin/connexions?page=${p}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setPage(d.page ?? 1);
        setPages(d.pages ?? 1);
        setLoading(false);
      });
  }

  useEffect(() => { fetchLogs(1); }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-purple-600" />
            Suivi des connexions
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} connexion{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Aucune connexion enregistrée.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date et heure</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Interlocuteur</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const r = ROLE_LABELS[log.role] ?? { label: log.role, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">{log.nom}</td>
                      <td className="px-6 py-3 text-gray-500">{log.email}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>
                          {r.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Page {page} / {pages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { const p = page - 1; setPage(p); fetchLogs(p); }}
                    disabled={page <= 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => { const p = page + 1; setPage(p); fetchLogs(p); }}
                    disabled={page >= pages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
