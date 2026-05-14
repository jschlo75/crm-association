"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Send, FileText, Users, CheckCircle, XCircle, Trash2,
  Pencil, Eye, EyeOff, AlertCircle, Mail
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

type Destinataire = {
  id: string;
  email: string;
  nom: string;
  envoye: boolean;
  erreur: string | null;
};

type Campagne = {
  id: string;
  nom: string;
  sujet: string;
  contenu: string;
  statut: "BROUILLON" | "ENVOYEE";
  dateEnvoi: string | null;
  nbDestinataires: number;
  user: { nom: string };
  destinataires: Destinataire[];
  createdAt: string;
};

export default function CampagneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;

  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ nbEnvoyes: number; nbErreurs: number; simulation: boolean } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ nom: "", sujet: "", contenu: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/campagnes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCampagne(d);
        setEditData({ nom: d.nom, sujet: d.sujet, contenu: d.contenu });
        setLoading(false);
      });
  }, [id]);

  async function handleSend() {
    if (!confirm(`Envoyer cette campagne à ${campagne!.destinataires.length} destinataire(s) ?`)) return;
    setSending(true);
    const res = await fetch(`/api/campagnes/${id}/envoyer`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setSendResult(data);
      setCampagne((prev) => prev ? { ...prev, statut: "ENVOYEE", dateEnvoi: new Date().toISOString(), nbDestinataires: data.nbEnvoyes } : prev);
    }
    setSending(false);
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette campagne définitivement ?")) return;
    await fetch(`/api/campagnes/${id}`, { method: "DELETE" });
    router.push("/campagnes");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/campagnes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      setCampagne((prev) => prev ? { ...prev, ...editData } : prev);
      setEditMode(false);
    }
    setSaving(false);
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (loading) return <div className="p-8 text-gray-400 text-sm">Chargement...</div>;
  if (!campagne) return <div className="p-8 text-red-500 text-sm">Campagne introuvable.</div>;

  const isEnvoyee = campagne.statut === "ENVOYEE";
  const nbOk = campagne.destinataires.filter((d) => d.envoye).length;
  const nbErr = campagne.destinataires.filter((d) => d.erreur).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnvoyee ? "bg-green-100" : "bg-amber-100"}`}>
            {isEnvoyee ? <Send size={22} className="text-green-600" /> : <FileText size={22} className="text-amber-600" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campagne.nom}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isEnvoyee ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {isEnvoyee ? "Envoyée" : "Brouillon"}
              </span>
              <span className="text-sm text-gray-500">par {campagne.user.nom}</span>
              {isEnvoyee && campagne.dateEnvoi && (
                <span className="text-sm text-gray-500">le {formatDateTime(campagne.dateEnvoi)}</span>
              )}
            </div>
          </div>
        </div>

        {(role === "ADMIN" || role === "RESTREINT") && (
          <div className="flex items-center gap-2">
            {!isEnvoyee && (
              <>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={15} />
                    Modifier
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                    <button
                      onClick={() => { setEditMode(false); setEditData({ nom: campagne.nom, sujet: campagne.sujet, contenu: campagne.contenu }); }}
                      className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </>
                )}
                <button
                  onClick={handleSend}
                  disabled={sending || campagne.destinataires.length === 0}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={15} />
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Résultat d'envoi */}
      {sendResult && (
        <div className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${sendResult.nbErreurs === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <CheckCircle size={18} className={sendResult.nbErreurs === 0 ? "text-green-600" : "text-amber-600"} />
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {sendResult.nbEnvoyes} email{sendResult.nbEnvoyes > 1 ? "s" : ""} envoyé{sendResult.nbEnvoyes > 1 ? "s" : ""}
              {sendResult.nbErreurs > 0 && `, ${sendResult.nbErreurs} erreur${sendResult.nbErreurs > 1 ? "s" : ""}`}
            </p>
            {sendResult.simulation && (
              <p className="text-amber-700 mt-1 flex items-center gap-1">
                <AlertCircle size={13} />
                Mode simulation — configurez <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> pour l'envoi réel.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Détails / édition */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Contenu</h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPreview ? "Source" : "Aperçu"}
              </button>
            </div>

            {editMode ? (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Nom</label>
                  <input value={editData.nom} onChange={(e) => setEditData({ ...editData, nom: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Objet</label>
                  <input value={editData.sujet} onChange={(e) => setEditData({ ...editData, sujet: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Contenu HTML</label>
                  <textarea
                    value={editData.contenu}
                    onChange={(e) => setEditData({ ...editData, contenu: e.target.value })}
                    rows={16}
                    className={`${inputClass} font-mono text-xs`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">Objet</p>
                  <p className="text-sm text-gray-800">{campagne.sujet}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium mb-2">Corps</p>
                  {showPreview ? (
                    <div
                      className="border border-gray-200 rounded-lg p-4 bg-white prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: campagne.contenu }}
                    />
                  ) : (
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-auto max-h-80">
                      {campagne.contenu}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats & destinataires */}
        <div className="col-span-1 space-y-4">
          {/* Stats */}
          {isEnvoyee && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900 text-sm">Résultats</h2>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-green-500" />
                <span className="text-sm text-gray-700">{nbOk} envoyé{nbOk > 1 ? "s" : ""}</span>
              </div>
              {nbErr > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle size={15} className="text-red-500" />
                  <span className="text-sm text-gray-700">{nbErr} erreur{nbErr > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          )}

          {/* Destinataires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900 text-sm">
                Destinataires ({campagne.destinataires.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {campagne.destinataires.length === 0 ? (
                <li className="px-5 py-4 text-sm text-gray-400 text-center">Aucun destinataire.</li>
              ) : (
                campagne.destinataires.map((d) => (
                  <li key={d.id} className="px-5 py-3 flex items-center gap-2">
                    {isEnvoyee ? (
                      d.envoye
                        ? <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                        : d.erreur
                          ? <XCircle size={13} className="text-red-500 flex-shrink-0" />
                          : <Mail size={13} className="text-gray-300 flex-shrink-0" />
                    ) : (
                      <Mail size={13} className="text-gray-300 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{d.nom}</p>
                      <p className="text-xs text-gray-400 truncate">{d.email}</p>
                      {d.erreur && <p className="text-xs text-red-500 truncate">{d.erreur}</p>}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
