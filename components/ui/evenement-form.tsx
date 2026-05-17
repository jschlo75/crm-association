"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";

type EvenementFormData = {
  id?: string;
  titre: string;
  date: string;
  lieu?: string;
  lien?: string;
  lienCr?: string;
  objectifs?: string;
};

export function EvenementForm({ defaultValues }: { defaultValues?: EvenementFormData }) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)?.value || "";

    const data = {
      titre: getValue("titre"),
      date: getValue("date"),
      lieu: getValue("lieu"),
      lien: getValue("lien"),
      lienCr: getValue("lienCr"),
      objectifs: getValue("objectifs"),
    };

    const url = isEdit ? `/api/evenements/${defaultValues!.id}` : "/api/evenements";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const ev = await res.json();
      router.push(`/evenements/${ev.id}`);
      router.refresh();
    } else {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  // Format date for input[type=datetime-local]
  const defaultDate = defaultValues?.date
    ? format(new Date(defaultValues.date), "yyyy-MM-dd'T'HH:mm")
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Informations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Titre *</label>
            <input name="titre" required defaultValue={defaultValues?.titre} className={inputClass} placeholder="Ex : Journée portes ouvertes" />
          </div>
          <div>
            <label className={labelClass}>Date et heure *</label>
            <input name="date" type="datetime-local" required defaultValue={defaultDate} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lieu</label>
            <input name="lieu" defaultValue={defaultValues?.lieu} className={inputClass} placeholder="Ex : Paris 8e" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Lien de connexion</label>
            <input
              name="lien"
              type="url"
              defaultValue={defaultValues?.lien}
              className={inputClass}
              placeholder="https://zoom.us/j/... ou https://teams.microsoft.com/..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>CR de réunion</label>
            <input
              name="lienCr"
              type="url"
              defaultValue={defaultValues?.lienCr}
              className={inputClass}
              placeholder="https://... (lien vers le compte rendu)"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Descriptif</h2>
        <textarea
          name="objectifs"
          rows={5}
          defaultValue={defaultValues?.objectifs}
          className={inputClass}
          placeholder="Décrivez l'événement (objectifs, programme, informations pratiques...)..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer l'événement"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="bg-white text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
          Annuler
        </button>
      </div>
    </form>
  );
}
