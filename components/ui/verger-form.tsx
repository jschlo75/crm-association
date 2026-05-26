"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Organisation = { id: string; nom: string };
type Contact = { id: string; prenom: string; nom: string };

type VergerFormData = {
  nom?: string;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  pays?: string;
  responsableType?: string | null;
  responsableOrganisationId?: string | null;
  responsableContactId?: string | null;
  nbArbres?: number | null;
  especesVarietes?: string | null;
  formesEspalier?: string | null;
  notes?: string | null;
};

interface VergerFormProps {
  initialData?: VergerFormData & { id?: string };
}

export function VergerForm({ initialData }: VergerFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState({
    nom: initialData?.nom ?? "",
    adresse: initialData?.adresse ?? "",
    codePostal: initialData?.codePostal ?? "",
    ville: initialData?.ville ?? "",
    pays: initialData?.pays ?? "France",
    responsableType: initialData?.responsableType ?? "",
    responsableOrganisationId: initialData?.responsableOrganisationId ?? "",
    responsableContactId: initialData?.responsableContactId ?? "",
    nbArbres: initialData?.nbArbres?.toString() ?? "",
    especesVarietes: initialData?.especesVarietes ?? "",
    formesEspalier: initialData?.formesEspalier ?? "",
    notes: initialData?.notes ?? "",
  });

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/organisations").then((r) => r.json()).then((d) => setOrganisations(Array.isArray(d) ? d : []));
    fetch("/api/contacts").then((r) => r.json()).then((d) => setContacts(Array.isArray(d) ? d : []));
  }, []);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      nom: form.nom,
      adresse: form.adresse || null,
      codePostal: form.codePostal || null,
      ville: form.ville || null,
      pays: form.pays || "France",
      responsableType: form.responsableType || null,
      responsableOrganisationId: form.responsableType === "ORGANISATION" ? form.responsableOrganisationId || null : null,
      responsableContactId: form.responsableType === "CONTACT" ? form.responsableContactId || null : null,
      nbArbres: form.nbArbres ? parseInt(form.nbArbres) : null,
      especesVarietes: form.especesVarietes || null,
      formesEspalier: form.formesEspalier || null,
      notes: form.notes || null,
    };

    const url = isEdit ? `/api/vergers/${initialData!.id}` : "/api/vergers";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/vergers/${data.id ?? initialData!.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Une erreur est survenue.");
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Identité */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Identité</h3>
        <div>
          <label className={labelClass}>Nom du verger *</label>
          <input
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            required
            className={inputClass}
            placeholder="Ex. Verger de la Croix"
          />
        </div>
      </div>

      {/* Adresse */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Localisation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Adresse</label>
            <input value={form.adresse} onChange={(e) => set("adresse", e.target.value)} className={inputClass} placeholder="Rue, lieu-dit..." />
          </div>
          <div>
            <label className={labelClass}>Code postal</label>
            <input value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ville</label>
            <input value={form.ville} onChange={(e) => set("ville", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pays</label>
            <input value={form.pays} onChange={(e) => set("pays", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Responsable */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Responsable</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type de responsable</label>
            <select value={form.responsableType} onChange={(e) => set("responsableType", e.target.value)} className={inputClass}>
              <option value="">— Aucun —</option>
              <option value="ORGANISATION">Organisation</option>
              <option value="CONTACT">Contact</option>
            </select>
          </div>
          {form.responsableType === "ORGANISATION" && (
            <div>
              <label className={labelClass}>Organisation</label>
              <select value={form.responsableOrganisationId} onChange={(e) => set("responsableOrganisationId", e.target.value)} className={inputClass}>
                <option value="">— Sélectionner —</option>
                {organisations.map((o) => (
                  <option key={o.id} value={o.id}>{o.nom}</option>
                ))}
              </select>
            </div>
          )}
          {form.responsableType === "CONTACT" && (
            <div>
              <label className={labelClass}>Contact</label>
              <select value={form.responsableContactId} onChange={(e) => set("responsableContactId", e.target.value)} className={inputClass}>
                <option value="">— Sélectionner —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Caractéristiques */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Caractéristiques</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nombre d'arbres</label>
            <input
              type="number"
              min="0"
              value={form.nbArbres}
              onChange={(e) => set("nbArbres", e.target.value)}
              className={inputClass}
              placeholder="Ex. 120"
            />
          </div>
          <div>
            <label className={labelClass}>Espèces / Variétés</label>
            <textarea
              value={form.especesVarietes}
              onChange={(e) => set("especesVarietes", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Ex. Pommier Golden Delicious, Poirier Williams, Prunier Reine-Claude..."
            />
          </div>
          <div>
            <label className={labelClass}>Formes d'espalier</label>
            <textarea
              value={form.formesEspalier}
              onChange={(e) => set("formesEspalier", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Ex. Palmette Verrier, Candélabre, Gobelet aplati..."
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Observations, historique..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le verger"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
