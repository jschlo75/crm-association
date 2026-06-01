"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Users, Plus, Search, ChevronRight, Download, ChevronLeft } from "lucide-react";

type Contact = {
  id: string;
  prenom: string;
  nom: string;
  poste: string | null;
  email: string | null;
  ville: string | null;
  organisation: { id: string; nom: string } | null;
  _count: { interactions: number };
};

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
        Page {page} / {pages} — {total} contact{total > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                n === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {n}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetchContacts = useCallback((q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (q) params.set("q", q);
    fetch(`/api/contacts?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setContacts(res.data ?? []);
        setTotal(res.total ?? 0);
        setPages(res.pages ?? 1);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchContacts(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchContacts]);

  useEffect(() => {
    fetchContacts(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handlePage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          {!loading && <p className="text-sm text-gray-500 mt-0.5">{total} contact{total > 1 ? "s" : ""}</p>}
        </div>
        {role === "ADMIN" && (
          <div className="flex items-center gap-2">
            <a
              href="/api/export/contacts"
              download
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Exporter Excel
            </a>
            <Link
              href="/contacts/nouveau"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Nouveau contact
            </Link>
          </div>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un contact (nom, prénom, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {search ? "Aucun contact trouvé." : "Aucun contact pour le moment."}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                      {contact.prenom[0]}{contact.nom[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{contact.prenom} {contact.nom}</span>
                        {contact.poste && <span className="text-xs text-gray-500">— {contact.poste}</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
                        {contact.organisation && <span className="text-blue-600">{contact.organisation.nom}</span>}
                        {contact.email && <span>{contact.email}</span>}
                        <span>{contact._count.interactions} interaction{contact._count.interactions > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
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
