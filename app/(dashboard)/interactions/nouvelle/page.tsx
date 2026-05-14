"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Organisation = { id: string; nom: string };
type Contact = { id: string; prenom: string; nom: string; organisation: { nom: string } | null };

const TYPES = [
  { value: "APPEL", label: "📞 Appel téléphonique" },
  { value: "EMAIL", label: "✉️ Email" },
  { value: "REUNION", label: "🤝 Réunion" },
];

function NouvelleInteractionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preOrganisationId = searchParams.get("organisationId") || "";
  const preContactId = searchParams.get("contactId") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetch("/api/organisations").then((r) => r.json()).then(setOrganisations);
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || "";

    const data = {
      date: getValue("date"),
      type: getValue("type"),
      sujet: getValue("sujet"),
      description: getValue("description"),
      organisationId: getValue("organisationId"),
      contactId: getValue("contactId"),
    };

    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/interactions");
      router.refresh();
    } else {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nouvelle interaction</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Détails</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date *</label>
              <input name="date" type="date" required defaultValue={today} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type *</label>
              <select name="type" required className={inputClass}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Sujet *</label>
              <input name="sujet" required className={inputClass} placeholder="Objet de l'interaction..." />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Description</label>
              <textarea name="description" rows={4} className={inputClass} placeholder="Notes, compte-rendu..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Rattachement</h2>
          <p className="text-sm text-gray-500">Liez cette interaction à une organisation et/ou un contact.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Organisation</label>
              <select name="organisationId" defaultValue={preOrganisationId} className={inputClass}>
                <option value="">— Aucune —</option>
                {organisations.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Contact</label>
              <select name="contactId" defaultValue={preContactId} className={inputClass}>
                <option value="">— Aucun —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom}{c.organisation ? ` (${c.organisation.nom})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
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

export default function NouvelleInteractionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Chargement...</div>}>
      <NouvelleInteractionForm />
    </Suspense>
  );
}
