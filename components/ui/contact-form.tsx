"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";

type ContactFormData = {
  prenom: string;
  nom: string;
  poste: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  notes: string;
  organisationId: string;
  isMembre: boolean;
  dateAdhesion: string;
};

type Props = {
  defaultValues?: Partial<ContactFormData> & { id?: string };
  defaultOrganisationId?: string;
};

type Organisation = { id: string; nom: string };

export function ContactForm({ defaultValues, defaultOrganisationId }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  // Controlled fields
  const [organisationId, setOrganisationId] = useState(defaultValues?.organisationId || defaultOrganisationId || "");
  const [isMembre, setIsMembre] = useState(defaultValues?.isMembre ?? false);

  useEffect(() => {
    fetch("/api/organisations").then((r) => r.json()).then(setOrganisations);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || "";

    const data = {
      prenom: getValue("prenom"),
      nom: getValue("nom"),
      poste: getValue("poste"),
      email: getValue("email"),
      telephone: getValue("telephone"),
      adresse: getValue("adresse"),
      codePostal: getValue("codePostal"),
      ville: getValue("ville"),
      pays: getValue("pays") || "France",
      notes: getValue("notes"),
      organisationId,
      isMembre,
      dateAdhesion: isMembre ? getValue("dateAdhesion") : "",
    };

    const url = isEdit ? `/api/contacts/${defaultValues!.id}` : "/api/contacts";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const contact = await res.json();
      router.push(`/contacts/${contact.id}`);
      router.refresh();
    } else {
      setError("Une erreur est survenue. Vérifiez les champs.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Prénom *</label>
            <input name="prenom" required defaultValue={defaultValues?.prenom} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nom *</label>
            <input name="nom" required defaultValue={defaultValues?.nom} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Poste / Fonction</label>
            <input name="poste" defaultValue={defaultValues?.poste} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Organisation associée</label>
            <select
              name="organisationId"
              value={organisationId}
              onChange={(e) => setOrganisationId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Aucune —</option>
              {organisations.map((o) => (
                <option key={o.id} value={o.id}>{o.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" defaultValue={defaultValues?.email} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input name="telephone" defaultValue={defaultValues?.telephone} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Adhésion */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Adhésion SNHF</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isMembre}
            onChange={(e) => setIsMembre(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Membre de l'association</span>
        </label>
        {isMembre && (
          <div className="ml-7">
            <label className={labelClass}>Date d'adhésion</label>
            <input
              name="dateAdhesion"
              type="date"
              defaultValue={defaultValues?.dateAdhesion}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Adresse postale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Adresse</label>
            <input name="adresse" defaultValue={defaultValues?.adresse} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Code postal</label>
            <input name="codePostal" defaultValue={defaultValues?.codePostal} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ville</label>
            <input name="ville" defaultValue={defaultValues?.ville} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pays</label>
            <input name="pays" defaultValue={defaultValues?.pays || "France"} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Notes</h2>
        <textarea
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes}
          className={inputClass}
          placeholder="Informations complémentaires..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le contact"}
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
  );
}
