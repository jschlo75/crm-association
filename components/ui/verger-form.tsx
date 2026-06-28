"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Organisation = { id: string; nom: string };
type Contact = { id: string; prenom: string; nom: string };

type Arbre = {
  espece: string;
  nbArbres: number | null;
  varietes: string;
  formes: string;
  ageMoyen: number | null;
};

const ESPECES_DEFAUT = [
  "Poiriers", "Pommiers", "Pêchers", "Pruniers", "Abricotiers", "Vigne", "Arbustes",
];

function initArbres(arbres?: Arbre[]): Arbre[] {
  if (arbres && arbres.length > 0) return arbres.map((a) => ({
    espece: a.espece,
    nbArbres: a.nbArbres ?? null,
    varietes: a.varietes ?? "",
    formes: a.formes ?? "",
    ageMoyen: a.ageMoyen ?? null,
  }));
  return ESPECES_DEFAUT.map((e) => ({ espece: e, nbArbres: null, varietes: "", formes: "", ageMoyen: null }));
}

type VergerFormData = {
  id?: string;
  nom?: string;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  pays?: string;
  contact?: string | null;
  proprietaire?: string | null;
  exploitant?: string | null;
  ouvertPublic?: boolean;
  superficie?: number | null;
  sol?: string | null;
  ph?: number | null;
  pluviometrie?: number | null;
  moisDeficit?: string | null;
  responsableType?: string | null;
  responsableOrganisationId?: string | null;
  responsableContactId?: string | null;
  anneeCreation?: number | null;
  anneeConversion?: number | null;
  certifications?: string | null;
  objectifs?: string | null;
  personnelEmployes?: string | null;
  personnelBenevoles?: string | null;
  activitesFormation?: string | null;
  autresActivites?: string | null;
  notes?: string | null;
  arbres?: Arbre[];
};

export function VergerForm({ initialData }: { initialData?: VergerFormData }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState({
    nom: initialData?.nom ?? "",
    adresse: initialData?.adresse ?? "",
    codePostal: initialData?.codePostal ?? "",
    ville: initialData?.ville ?? "",
    pays: initialData?.pays ?? "France",
    contact: initialData?.contact ?? "",
    proprietaire: initialData?.proprietaire ?? "",
    exploitant: initialData?.exploitant ?? "",
    ouvertPublic: initialData?.ouvertPublic ?? false,
    superficie: initialData?.superficie?.toString() ?? "",
    sol: initialData?.sol ?? "",
    ph: initialData?.ph?.toString() ?? "",
    pluviometrie: initialData?.pluviometrie?.toString() ?? "",
    moisDeficit: initialData?.moisDeficit ?? "",
    responsableType: initialData?.responsableType ?? "",
    responsableOrganisationId: initialData?.responsableOrganisationId ?? "",
    responsableContactId: initialData?.responsableContactId ?? "",
    anneeCreation: initialData?.anneeCreation?.toString() ?? "",
    anneeConversion: initialData?.anneeConversion?.toString() ?? "",
    certifications: initialData?.certifications ?? "",
    objectifs: initialData?.objectifs ?? "",
    personnelEmployes: initialData?.personnelEmployes ?? "",
    personnelBenevoles: initialData?.personnelBenevoles ?? "",
    activitesFormation: initialData?.activitesFormation ?? "",
    autresActivites: initialData?.autresActivites ?? "",
    notes: initialData?.notes ?? "",
  });

  const [arbres, setArbres] = useState<Arbre[]>(() => initArbres(initialData?.arbres));
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/organisations?limit=9999").then((r) => r.json()).then((d) => setOrganisations(Array.isArray(d) ? d : (d.data ?? [])));
    fetch("/api/contacts?limit=9999").then((r) => r.json()).then((d) => setContacts(Array.isArray(d) ? d : (d.data ?? [])));
  }, []);

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  function setArbre(i: number, key: keyof Arbre, value: string) {
    setArbres((prev) => prev.map((a, idx) => idx !== i ? a : {
      ...a,
      [key]: key === "nbArbres" || key === "ageMoyen"
        ? (value === "" ? null : parseInt(value))
        : value,
    }));
  }

  function addArbre() {
    setArbres((prev) => [...prev, { espece: "", nbArbres: null, varietes: "", formes: "", ageMoyen: null }]);
  }

  function removeArbre(i: number) {
    setArbres((prev) => prev.filter((_, idx) => idx !== i));
  }

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
      contact: form.contact || null,
      proprietaire: form.proprietaire || null,
      exploitant: form.exploitant || null,
      ouvertPublic: form.ouvertPublic,
      superficie: form.superficie ? parseFloat(form.superficie) : null,
      sol: form.sol || null,
      ph: form.ph ? parseFloat(form.ph) : null,
      pluviometrie: form.pluviometrie ? parseFloat(form.pluviometrie) : null,
      moisDeficit: form.moisDeficit || null,
      responsableType: form.responsableType || null,
      responsableOrganisationId: form.responsableType === "ORGANISATION" ? form.responsableOrganisationId || null : null,
      responsableContactId: form.responsableType === "CONTACT" ? form.responsableContactId || null : null,
      anneeCreation: form.anneeCreation ? parseInt(form.anneeCreation) : null,
      anneeConversion: form.anneeConversion ? parseInt(form.anneeConversion) : null,
      certifications: form.certifications || null,
      objectifs: form.objectifs || null,
      personnelEmployes: form.personnelEmployes || null,
      personnelBenevoles: form.personnelBenevoles || null,
      activitesFormation: form.activitesFormation || null,
      autresActivites: form.autresActivites || null,
      notes: form.notes || null,
      arbres: arbres.filter((a) => a.espece.trim()).map((a, i) => ({ ...a, ordre: i })),
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
  const sectionClass = "text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Identité */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Identité</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nom du verger *</label>
            <input value={form.nom} onChange={(e) => set("nom", e.target.value)} required className={inputClass} placeholder="Ex. Verger de la Croix" />
          </div>
          <div>
            <label className={labelClass}>Propriétaire</label>
            <input value={form.proprietaire} onChange={(e) => set("proprietaire", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Exploitant</label>
            <input value={form.exploitant} onChange={(e) => set("exploitant", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Année de création</label>
            <input type="number" min="1800" max="2100" value={form.anneeCreation} onChange={(e) => set("anneeCreation", e.target.value)} className={inputClass} placeholder="Ex. 1985" />
          </div>
          <div>
            <label className={labelClass}>Année de conversion en bio</label>
            <input type="number" min="1800" max="2100" value={form.anneeConversion} onChange={(e) => set("anneeConversion", e.target.value)} className={inputClass} placeholder="Ex. 2010" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="ouvertPublic"
              checked={form.ouvertPublic}
              onChange={(e) => set("ouvertPublic", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ouvertPublic" className="text-sm font-medium text-gray-700">Ouvert au public</label>
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Localisation</h3>
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

      {/* Contact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Contact</h3>
        <div>
          <label className={labelClass}>Nom, adresse email, téléphone</label>
          <textarea value={form.contact} onChange={(e) => set("contact", e.target.value)} rows={2} className={inputClass} placeholder="Ex. Jean Dupont, jean@example.com, 06 12 34 56 78" />
        </div>
      </div>

      {/* Caractéristiques */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Caractéristiques</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Superficie (m²)</label>
            <input type="number" min="0" step="0.01" value={form.superficie} onChange={(e) => set("superficie", e.target.value)} className={inputClass} placeholder="Ex. 5000" />
          </div>
          <div>
            <label className={labelClass}>Sol</label>
            <input value={form.sol} onChange={(e) => set("sol", e.target.value)} className={inputClass} placeholder="Ex. Argileux, limoneux..." />
          </div>
          <div>
            <label className={labelClass}>pH</label>
            <input type="number" min="0" max="14" step="0.1" value={form.ph} onChange={(e) => set("ph", e.target.value)} className={inputClass} placeholder="Ex. 6.5" />
          </div>
          <div>
            <label className={labelClass}>Pluviométrie annuelle (mm)</label>
            <input type="number" min="0" value={form.pluviometrie} onChange={(e) => set("pluviometrie", e.target.value)} className={inputClass} placeholder="Ex. 650" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Mois de déficit hydrique</label>
            <input value={form.moisDeficit} onChange={(e) => set("moisDeficit", e.target.value)} className={inputClass} placeholder="Ex. Juillet, Août" />
          </div>
        </div>
      </div>

      {/* Certifications & Objectifs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Certifications & Objectifs</h3>
        <div>
          <label className={labelClass}>Certifications, signes de qualité, labellisations</label>
          <textarea value={form.certifications} onChange={(e) => set("certifications", e.target.value)} rows={2} className={inputClass} placeholder="Ex. AB, HVE, Label Rouge..." />
        </div>
        <div>
          <label className={labelClass}>Objectifs du verger</label>
          <textarea value={form.objectifs} onChange={(e) => set("objectifs", e.target.value)} rows={2} className={inputClass} placeholder="Ex. Production, conservatoire, pédagogique..." />
        </div>
      </div>

      {/* Personnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Personnel impliqué</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Personnes employées</label>
            <input value={form.personnelEmployes} onChange={(e) => set("personnelEmployes", e.target.value)} className={inputClass} placeholder="Ex. 2 personnes, 1,5 ETP" />
          </div>
          <div>
            <label className={labelClass}>Bénévoles</label>
            <input value={form.personnelBenevoles} onChange={(e) => set("personnelBenevoles", e.target.value)} className={inputClass} placeholder="Ex. 5 bénévoles, 0,5 ETP" />
          </div>
        </div>
      </div>

      {/* Activités */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Activités</h3>
        <div>
          <label className={labelClass}>Activités de formation (nature, périodicité, dates)</label>
          <textarea value={form.activitesFormation} onChange={(e) => set("activitesFormation", e.target.value)} rows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Autres activités du verger</label>
          <textarea value={form.autresActivites} onChange={(e) => set("autresActivites", e.target.value)} rows={2} className={inputClass} />
        </div>
      </div>

      {/* Tableau des arbres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className={sectionClass}>Arbres</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <th className="pb-2 pr-3 w-36">Espèce</th>
                <th className="pb-2 pr-3 w-24">Nb arbres</th>
                <th className="pb-2 pr-3">Variétés</th>
                <th className="pb-2 pr-3">Formes de conduite</th>
                <th className="pb-2 pr-3 w-24">Âge moyen</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {arbres.map((a, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3">
                    <input
                      value={a.espece}
                      onChange={(e) => setArbre(i, "espece", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Espèce"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      value={a.nbArbres ?? ""}
                      onChange={(e) => setArbre(i, "nbArbres", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={a.varietes}
                      onChange={(e) => setArbre(i, "varietes", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={a.formes}
                      onChange={(e) => setArbre(i, "formes", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      value={a.ageMoyen ?? ""}
                      onChange={(e) => setArbre(i, "ageMoyen", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2">
                    <button type="button" onClick={() => removeArbre(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addArbre}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus size={14} />
          Ajouter une ligne
        </button>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className={labelClass}>Notes</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={inputClass} placeholder="Observations, historique..." />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
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
