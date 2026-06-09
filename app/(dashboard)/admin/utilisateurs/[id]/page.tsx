"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Shield, ShieldCheck, CheckCircle2, XCircle,
  Clock, Trash2, ToggleLeft, ToggleRight, Send
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type UserDetail = {
  id: string;
  prenom: string | null;
  nom: string;
  email: string;
  role: "ADMIN" | "MEMBRE" | "RESTREINT";
  actif: boolean;
  consentementPartageContacts: boolean;
  consentementEmailsInfo: boolean;
  consentementMisAJourLe: string | null;
  createdAt: string;
  updatedAt: string;
  connexions: { createdAt: string; role: string }[];
};

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrateur", MEMBRE: "Membre", RESTREINT: "Restreint" };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  MEMBRE: "bg-gray-100 text-gray-600",
  RESTREINT: "bg-amber-100 text-amber-700",
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id: string })?.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => { setUser(d); setLoading(false); });
  }, [id]);

  async function update(data: object) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev) => prev ? { ...prev, ...updated } : prev);
    }
  }

  async function toggleRole() {
    if (!user) return;
    setActionLoading("role");
    const cycle: Record<string, string> = { MEMBRE: "RESTREINT", RESTREINT: "ADMIN", ADMIN: "MEMBRE" };
    await update({ role: cycle[user.role] ?? "MEMBRE" });
    setActionLoading("");
  }

  async function toggleActif() {
    if (!user) return;
    setActionLoading("actif");
    await update({ actif: !user.actif });
    setActionLoading("");
  }

  async function envoyerAcces() {
    if (!user) return;
    if (!confirm(`Envoyer les accès à ${user.nom} (${user.email}) ?\n\nCela génère un nouveau mot de passe et l'envoie par email.`)) return;
    setActionLoading("mail");
    const res = await fetch(`/api/admin/users/${id}/envoyer-acces`, { method: "POST" });
    if (res.ok) alert(`✓ Email envoyé à ${user.email}`);
    else { const d = await res.json(); alert(`Erreur : ${d.error || "Échec de l'envoi"}`); }
    setActionLoading("");
  }

  async function handleDelete() {
    if (!confirm("Supprimer cet utilisateur définitivement ?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin");
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm text-center">Chargement...</div>;
  if (!user) return <div className="p-8 text-gray-500 text-sm text-center">Utilisateur introuvable.</div>;

  const isSelf = user.id === currentUserId;
  const initiales = user.prenom
    ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    : user.nom[0].toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Retour */}
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={15} />
        Retour à la liste
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0">
              {initiales}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.prenom ? `${user.prenom} ${user.nom}` : user.nom}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <Mail size={13} className="text-gray-400" />
                <a href={`mailto:${user.email}`} className="hover:text-blue-600">{user.email}</a>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                  <Shield size={10} />
                  {ROLE_LABELS[user.role]}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {user.actif ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isSelf && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={envoyerAcces}
                disabled={actionLoading === "mail"}
                className="flex items-center gap-2 text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Send size={13} />
                Envoyer accès
              </button>
              <button
                onClick={toggleRole}
                disabled={actionLoading === "role"}
                className="flex items-center gap-2 text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Shield size={13} />
                {user.role === "ADMIN" ? "→ Membre" : user.role === "RESTREINT" ? "→ Admin" : "→ Restreint"}
              </button>
              <button
                onClick={toggleActif}
                disabled={actionLoading === "actif"}
                className="flex items-center gap-2 text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {user.actif ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                {user.actif ? "Désactiver" : "Activer"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-sm bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
                Supprimer
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div>Créé le <span className="text-gray-700 font-medium">{formatDate(user.createdAt)}</span></div>
          <div>Modifié le <span className="text-gray-700 font-medium">{formatDate(user.updatedAt)}</span></div>
        </div>
      </div>

      {/* Consentements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <ShieldCheck size={16} className="text-gray-400" />
          Consentements
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {user.consentementPartageContacts
              ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              : <XCircle size={16} className="text-gray-300 flex-shrink-0" />}
            <div>
              <p className={`text-sm font-medium ${user.consentementPartageContacts ? "text-gray-800" : "text-gray-400"}`}>
                Partage des informations de contact
              </p>
              <p className="text-xs text-gray-400">
                {user.consentementPartageContacts ? "Accordé" : "Non accordé"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.consentementEmailsInfo
              ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              : <XCircle size={16} className="text-gray-300 flex-shrink-0" />}
            <div>
              <p className={`text-sm font-medium ${user.consentementEmailsInfo ? "text-gray-800" : "text-gray-400"}`}>
                Réception d&apos;emails d&apos;information SNHF
              </p>
              <p className="text-xs text-gray-400">
                {user.consentementEmailsInfo ? "Accordé" : "Non accordé"}
              </p>
            </div>
          </div>
        </div>
        {user.consentementMisAJourLe && (
          <p className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
            Dernière mise à jour : {new Date(user.consentementMisAJourLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {!user.consentementMisAJourLe && (
          <p className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 italic">
            L&apos;utilisateur n&apos;a pas encore renseigné ses préférences.
          </p>
        )}
      </div>

      {/* Dernières connexions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Clock size={15} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Dernières connexions</h2>
        </div>
        {user.connexions.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-400 text-center">Aucune connexion enregistrée.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {user.connexions.map((c, i) => (
              <li key={i} className="px-6 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[c.role] ?? "bg-gray-100 text-gray-500"}`}>
                  {ROLE_LABELS[c.role] ?? c.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
