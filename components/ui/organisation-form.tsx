"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type OrganisationFormData = {
  nom: string;
  type: string;
  email: string;
  telephone: string;
  siteWeb: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  notes: string;
  parentId: string;
};

type Props = {
  defaultValues?: Partial<OrganisationFormData> & { id?: string };
};

type OrganisationOption = { id: string; nom: string };

const TYPES = [
  { value: "ENSEIGNEMENT", label: "Enseignement" },
  { value: "ASSOCIATION", label: "Association" },
  { value: "FEDERATION", label: "Fédération" },
  { value: "JARDIN_PRIVE", label: "Jardin privé" },
  { value: "ORGANISME_PUBLIC", label: "Organisme public" },
];

export function OrganisationForm({ defaultValues }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [organisations, setOrganisations] = useState<OrganisationOption[]>([]);
  const [parentId, setParentId] = useState(defaultValues?.parentId || "");

  useEffect(() => {
    fetch("/api/organisations")
      .then((r) => r.json())
      .then((data: OrganisationOption[]) => {
        setOrganisations(data.filter((o) => o.id !== defaultValues?.id));
      });
  }, [defaultValues?.id]);

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
      siteWeb: getValue("siteWeb"),
      adresse: getValue("adresse"),
      codePostal: getValue("codePostal"),
      ville: getValue("ville"),
      pays: getValue("pays") || "France",
      notes: getValue("notes"),
      parentId,
    };

    const url = isEdit ? `/api/organisations/${defaultValues!.id}` : "/api/organisations";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const organisation = await res.json();
      router.push(`/organisations/${organisation.id}`);
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "Une erreur est survenue. Vérifiez les champs.");
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nom *</label>
            <input name="nom" required defaultValue={defaultValues?.nom} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type *</label>
            <select name="type" required defaultValue={defaultValues?.type || "ASSOCIATION"} className={inputClass}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Organisation parente</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Aucune (racine) —</option>
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
          <div className="sm:col-span-2">
            <label className={labelClass}>Site web</label>
            <input
              name="siteWeb"
              type="url"
              defaultValue={defaultValues?.siteWeb}
              className={inputClass}
              placeholder="https://www.exemple.fr"
            />
          </div>
        </div>
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
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer l'organisation"}
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
