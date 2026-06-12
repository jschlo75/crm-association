"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Shield, User, ShieldCheck, Mail, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

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
        Page {page} / {pages} — {total} utilisateur{total > 1 ? "s" : ""}
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

type User = {
  id: string;
  nom: string;
  email: string;
  role: "ADMIN" | "MEMBRE" | "RESTREINT";
  actif: boolean;
  createdAt: string;
  organisation: { id: string; nom: string } | null;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role: string })?.role;

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback((q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (q) params.set("q", q);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((res) => { setUsers(res.data ?? []); setTotal(res.total ?? 0); setPages(res.pages ?? 1); setLoading(false); });
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (role !== "ADMIN") { router.push("/dashboard"); return; }
    fetchUsers(search, page);
  }, [role, status]);

  useEffect(() => {
    if (status === "loading" || role !== "ADMIN") return;
    const timer = setTimeout(() => { setPage(1); fetchUsers(search, 1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (status === "loading" || role !== "ADMIN") return;
    fetchUsers(search, page);
  }, [page]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value || "";

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: getValue("nom"),
        email: getValue("email"),
        password: getValue("password"),
        role: getValue("role"),
      }),
    });

    if (res.ok) {
      setShowForm(false);
      form.reset();
      fetchUsers(search, page);
    } else {
      const data = await res.json();
      setFormError(data.error || "Erreur lors de la création.");
    }
    setFormLoading(false);
  }

  async function toggleRole(user: User) {
    const cycle: Record<User["role"], User["role"]> = { MEMBRE: "RESTREINT", RESTREINT: "ADMIN", ADMIN: "MEMBRE" };
    const newRole = cycle[user.role] ?? "MEMBRE";
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
    }
  }

  async function toggleActif(user: User) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !user.actif }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, actif: !u.actif } : u));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet utilisateur définitivement ?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function envoyerAcces(user: User) {
    if (!confirm(`Envoyer les accès à ${user.nom} (${user.email}) ?\n\nCela génère un nouveau mot de passe et l'envoie par email.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}/envoyer-acces`, { method: "POST" });
    if (res.ok) {
      alert(`✓ Email envoyé à ${user.email}`);
    } else {
      const data = await res.json();
      alert(`Erreur : ${data.error || "Échec de l'envoi"}`);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Administration — Utilisateurs</h1>
        <div className="flex items-center gap-2">
          {!loading && <p className="text-sm text-gray-500">{total} utilisateur{total > 1 ? "s" : ""}</p>}
          <Link
            href="/admin/connexions"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ShieldCheck size={16} />
            Suivi des connexions
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Créer un compte utilisateur</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nom complet *</label>
                <input name="nom" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Mot de passe * (min. 8 caractères)</label>
                <input name="password" type="password" required minLength={8} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Rôle *</label>
                <select name="role" className={inputClass}>
                  <option value="MEMBRE">Membre</option>
                  <option value="RESTREINT">Restreint</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                {formLoading ? "Création..." : "Créer"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un utilisateur (nom, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <>
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Utilisateur</th>
                <th className="px-6 py-3">Organisation</th>
                <th className="px-6 py-3">Rôle</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Créé le</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelf = user.id === (session?.user as { id: string })?.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/utilisateurs/${user.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {user.nom[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{user.nom}</div>
                          <div className="text-gray-500 text-xs">{user.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {user.organisation ? (
                        <Link href={`/organisations/${user.organisation.id}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                          <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                          {user.organisation.nom}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "RESTREINT"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.role === "ADMIN" ? <Shield size={11} /> : <User size={11} />}
                        {user.role === "ADMIN" ? "Admin" : user.role === "RESTREINT" ? "Restreint" : "Membre"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {user.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      {!isSelf && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => envoyerAcces(user)}
                            title="Envoyer les accès par email"
                            className="text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <Mail size={14} />
                          </button>
                          <button
                            onClick={() => toggleRole(user)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {user.role === "ADMIN" ? "→ Membre" : user.role === "RESTREINT" ? "→ Admin" : "→ Restreint"}
                          </button>
                          <button
                            onClick={() => toggleActif(user)}
                            className="text-xs text-gray-600 hover:underline"
                          >
                            {user.actif ? "Désactiver" : "Activer"}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {isSelf && <span className="text-xs text-gray-400">Vous</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} total={total} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </>
        )}
      </div>
    </div>
  );
}
