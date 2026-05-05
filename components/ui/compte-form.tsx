"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CompteFormData = {
  nom: string;
  type: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  notes: string;
};

type Props = {
  defaultValues?: Partial<CompteFormData> & { id?: string };
};

const TYPES = [
  { value: "ENTREPRISE", label: "Entreprise" },
  { value: "ASSOCIATION", label: "Association" },
  { value: "COLLECTIVITE", label: "Collectivité" },
  { value: "PARTICULIER", label: "Particulier" },
  { value: "AUTRE", label: "Autre" },
];

export function CompteForm({ defaultValues }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || "";

    const data = {
      nom: getValue("nom"),
      type: getValue("type"),
      email: getValue("email"),
      telephone: getValue("telephone"),
      adresse: getValue("adresse"),
      codePostal: getValue("codePostal"),
      ville: getValue("ville"),
      pays: getValue("pays") || "France",
      notes: getValue("notes"),
    };

    const url = isEdit ? `/api/comptes/${defaultValues!.id}` : "/api/comptes";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const compte = await res.json();
      router.push(`/comptes/${compte.id}`);
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
        <h2 className="font-semibold text-gray-900">Informations générales</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Nom *</label>
            <input name="nom" required defaultValue={defaultValues?.nom} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type *</label>
            <select name="type" required defaultValue={defaultValues?.type || "AUTRE"} className={inputClass}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Adresse postale</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
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
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le compte"}
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
