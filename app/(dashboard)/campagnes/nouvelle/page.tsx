"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Eye, EyeOff } from "lucide-react";

type Interlocuteur = { id: string; prenom: string | null; nom: string; email: string };

function NouvelleCampagneForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [interlocuteurs, setInterlocuteurs] = useState<Interlocuteur[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [contenu, setContenu] = useState("");

  useEffect(() => {
    if (role !== "ADMIN" && role !== "RESTREINT") { router.push("/campagnes"); return; }
    fetch("/api/admin/users?limit=9999")
      .then((r) => r.json())
      .then((d) => {
        const all = Array.isArray(d) ? d : (d.data ?? []);
        setInterlocuteurs(all.filter((u: { consentementEmailsInfo?: boolean; actif?: boolean }) => u.consentementEmailsInfo && u.actif));
      });
  }, [role]);

  const destinataires = interlocuteurs;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (destinataires.length === 0) {
      setError("Aucun destinataire avec une adresse email pour ce filtre.");
      return;
    }
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || "";

    const res = await fetch("/api/campagnes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: getValue("nom"),
        sujet: getValue("sujet"),
        contenu,
      }),
    });

    if (res.ok) {
      const campagne = await res.json();
      router.push(`/campagnes/${campagne.id}`);
    } else {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nouvelle campagne email</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Informations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations</h2>
          <div>
            <label className={labelClass}>Nom de la campagne *</label>
            <input name="nom" required className={inputClass} placeholder="Ex : Newsletter printemps 2025" />
          </div>
          <div>
            <label className={labelClass}>Objet de l'email *</label>
            <input name="sujet" required className={inputClass} placeholder="Ex : Actualités horticoles — printemps 2025" />
          </div>
        </div>

        {/* Destinataires */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Destinataires</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <Users size={16} className="text-blue-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-blue-800">{destinataires.length} interlocuteur{destinataires.length > 1 ? "s" : ""}</span>
              <span className="text-blue-600"> ayant consenti à recevoir des emails</span>
            </div>
          </div>

          {destinataires.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Voir la liste</summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {destinataires.map((u) => (
                  <li key={u.id} className="flex items-center gap-2 text-gray-600 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span>{[u.prenom, u.nom].filter(Boolean).join(" ")}</span>
                    <span className="text-gray-400">— {u.email}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {destinataires.length === 0 && (
            <p className="text-sm text-gray-400 italic">Aucun interlocuteur n'a encore donné son consentement pour recevoir des emails.</p>
          )}
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Contenu de l'email</h2>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
              {showPreview ? "Masquer l'aperçu" : "Aperçu HTML"}
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Vous pouvez utiliser du HTML pour mettre en forme votre email (gras, liens, images...).
          </p>

          {!showPreview ? (
            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={16}
              required
              className={`${inputClass} font-mono text-xs`}
              placeholder={`<p>Chères adhérentes, chers adhérents,</p>\n\n<p>Voici les actualités du mois...</p>\n\n<p>Cordialement,<br/>La SNHF</p>`}
            />
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] bg-white prose prose-sm max-w-none">
              {contenu ? (
                <div dangerouslySetInnerHTML={{ __html: contenu }} />
              ) : (
                <p className="text-gray-400 italic">Aucun contenu à prévisualiser.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || destinataires.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? "Enregistrement..." : "Enregistrer en brouillon"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NouvelleCampagnePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Chargement...</div>}>
      <NouvelleCampagneForm />
    </Suspense>
  );
}
