"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Upload, FileSpreadsheet, Download, CheckCircle,
  AlertCircle, ChevronRight, X, RefreshCw
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportType = "organisations" | "contacts";
type Step = "choose" | "upload" | "mapping" | "preview" | "result";

type FieldDef = { key: string; label: string; required: boolean };

const ORGANISATION_FIELDS: FieldDef[] = [
  { key: "nom",        label: "Nom",          required: true  },
  { key: "type",       label: "Type",         required: false },
  { key: "email",      label: "Email",        required: false },
  { key: "telephone",  label: "Téléphone",    required: false },
  { key: "siteWeb",    label: "Site web",     required: false },
  { key: "adresse",    label: "Adresse",      required: false },
  { key: "codePostal", label: "Code postal",  required: false },
  { key: "ville",      label: "Ville",        required: false },
  { key: "pays",       label: "Pays",         required: false },
  { key: "notes",      label: "Notes",        required: false },
];

const CONTACT_FIELDS: FieldDef[] = [
  { key: "prenom",     label: "Prénom",       required: true  },
  { key: "nom",        label: "Nom",          required: true  },
  { key: "poste",      label: "Poste",        required: false },
  { key: "email",      label: "Email",        required: false },
  { key: "telephone",  label: "Téléphone",    required: false },
  { key: "adresse",    label: "Adresse",      required: false },
  { key: "codePostal", label: "Code postal",  required: false },
  { key: "ville",      label: "Ville",        required: false },
  { key: "pays",       label: "Pays",         required: false },
  { key: "notes",      label: "Notes",        required: false },
  { key: "organisation", label: "Organisation (nom)", required: false },
];

// ─── Auto-détection des colonnes ──────────────────────────────────────────────

const SYNONYMS: Record<string, string[]> = {
  nom:        ["nom", "name", "société", "societe", "company", "organisation", "organization", "raison sociale", "structure"],
  prenom:     ["prénom", "prenom", "first name", "firstname", "given name"],
  type:       ["type", "catégorie", "categorie", "category"],
  email:      ["email", "mail", "courriel", "e-mail", "adresse mail", "adresse email"],
  telephone:  ["téléphone", "telephone", "tel", "phone", "mobile", "portable", "tél"],
  adresse:    ["adresse", "address", "rue", "street", "voie"],
  codePostal: ["code postal", "codepostal", "cp", "postal code", "zip", "zip code"],
  ville:      ["ville", "city", "commune", "localité", "localite"],
  pays:       ["pays", "country", "nation"],
  notes:      ["notes", "commentaires", "remarques", "observations", "note", "comment", "comments"],
  siteWeb:    ["site web", "siteweb", "site", "website", "url", "www", "web", "site internet"],
  poste:      ["poste", "fonction", "titre", "title", "job", "position", "rôle", "role"],
  organisation: ["organisation", "compte", "société", "societe", "company", "organization", "entreprise", "établissement", "etablissement"],
};

function autoDetect(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const h = header.toLowerCase().trim();
    for (const [field, synonyms] of Object.entries(SYNONYMS)) {
      if (synonyms.some((s) => h === s || h.includes(s))) {
        if (!Object.values(mapping).includes(field)) {
          mapping[header] = field;
          break;
        }
      }
    }
  }
  return mapping;
}

// ─── Template téléchargeable ──────────────────────────────────────────────────

async function downloadTemplate(type: ImportType) {
  const XLSX = await import("xlsx");

  if (type === "organisations") {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nom", "Type", "Email", "Téléphone", "Site web", "Adresse", "Code postal", "Ville", "Pays", "Notes"],
      ["Association Exemple", "ASSOCIATION", "contact@exemple.fr", "01 23 45 67 89", "https://www.exemple.fr", "12 rue des Roses", "75001", "Paris", "France", ""],
      ["École nationale d'horticulture", "ENSEIGNEMENT", "contact@enh.fr", "01 30 83 40 00", "https://www.enh.fr", "4 rue Hardy", "78009", "Versailles", "France", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Organisations");
    XLSX.writeFile(wb, "template_organisations.xlsx");
  } else {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Prénom", "Nom", "Poste", "Email", "Téléphone", "Adresse", "Code postal", "Ville", "Pays", "Notes", "Organisation"],
      ["Marie", "Dupont", "Présidente", "m.dupont@exemple.fr", "06 12 34 56 78", "", "", "Paris", "France", "", "Association Exemple"],
      ["Jean", "Martin", "Directeur", "j.martin@mairie.fr", "04 72 10 30 31", "", "", "Lyon", "France", "", "Mairie de Lyon"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "template_contacts.xlsx");
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as { role: string })?.role;

  const [step, setStep] = useState<Step>("choose");
  const [importType, setImportType] = useState<ImportType>("organisations");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fields = importType === "organisations" ? ORGANISATION_FIELDS : CONTACT_FIELDS;

  // ─── Parse du fichier ────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
      defval: "",
      raw: false,
    });

    if (data.length === 0) return;

    const hdrs = Object.keys(data[0]);
    const detected = autoDetect(hdrs);

    setFileName(file.name);
    setHeaders(hdrs);
    setRawRows(data);
    setMapping(detected);
    setStep("mapping");
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert("Format non supporté. Utilisez un fichier .xlsx, .xls ou .csv");
      return;
    }
    parseFile(file);
  }, [parseFile]);

  // ─── Données mappées ─────────────────────────────────────────────────────────

  const mappedRows = rawRows.map((row) => {
    const out: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field && row[header] !== undefined) {
        out[field] = String(row[header]).trim();
      }
    }
    return out;
  }).filter((row) => {
    const required = fields.filter((f) => f.required).map((f) => f.key);
    return required.every((k) => row[k] && row[k].length > 0);
  });

  // ─── Import ──────────────────────────────────────────────────────────────────

  async function handleImport() {
    setImporting(true);
    const res = await fetch(`/api/import/${importType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: mappedRows }),
    });
    const data = await res.json();
    setResult(data);
    setStep("result");
    setImporting(false);
  }

  // ─── Reset ───────────────────────────────────────────────────────────────────

  function reset() {
    setStep("choose");
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  // ─── Rendu ───────────────────────────────────────────────────────────────────

  if (role !== "ADMIN") {
    return (
      <div className="p-8 text-center text-gray-500">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Importer depuis Excel</h1>
        {step !== "choose" && (
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <RefreshCw size={14} />
            Recommencer
          </button>
        )}
      </div>

      {/* Fil d'Ariane */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
        {(["choose", "upload", "mapping", "preview", "result"] as Step[]).map((s, i, arr) => {
          const labels: Record<Step, string> = {
            choose: "Type", upload: "Fichier", mapping: "Colonnes",
            preview: "Aperçu", result: "Résultat",
          };
          const idx = arr.indexOf(step);
          const active = s === step;
          const done = arr.indexOf(s) < idx;
          return (
            <span key={s} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                active ? "bg-blue-600 text-white" : done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
              }`}>
                {labels[s]}
              </span>
              {i < arr.length - 1 && <ChevronRight size={12} />}
            </span>
          );
        })}
      </div>

      {/* ── Étape 1 : Choisir le type ── */}
      {step === "choose" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["organisations", "contacts"] as ImportType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setImportType(t); setStep("upload"); }}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 text-left hover:border-blue-400 transition-colors ${
                  importType === t ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <FileSpreadsheet size={28} className="text-blue-500 mb-3" />
                <div className="font-semibold text-gray-900 capitalize">{t}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {t === "organisations"
                    ? "Importer des organisations, entreprises, associations…"
                    : "Importer des interlocuteurs, avec rattachement optionnel à une organisation"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Étape 2 : Upload ── */}
      {step === "upload" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Importer des {importType === "organisations" ? "organisations" : "contacts"}
              </h2>
              <button
                onClick={() => downloadTemplate(importType)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <Download size={14} />
                Télécharger le modèle Excel
              </button>
            </div>

            {/* Zone de dépôt */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <Upload size={32} className="text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Glissez votre fichier ici</p>
              <p className="text-sm text-gray-400 mt-1">ou cliquez pour sélectionner</p>
              <p className="text-xs text-gray-400 mt-2">.xlsx, .xls, .csv acceptés</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          </div>

          {/* Rappel des colonnes attendues */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm font-medium text-blue-800 mb-2">Colonnes reconnues automatiquement :</p>
            <div className="flex flex-wrap gap-2">
              {fields.map((f) => (
                <span key={f.key} className={`text-xs px-2 py-1 rounded-full ${
                  f.required ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
                }`}>
                  {f.label}{f.required ? " *" : ""}
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">* champs obligatoires — les colonnes déjà existantes ne seront pas dupliquées (mise à jour)</p>
          </div>
        </div>
      )}

      {/* ── Étape 3 : Mapping des colonnes ── */}
      {step === "mapping" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Correspondance des colonnes</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Fichier : <span className="font-medium">{fileName}</span> —{" "}
                  {rawRows.length} ligne{rawRows.length > 1 ? "s" : ""} détectée{rawRows.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  <th className="pb-2 pr-4">Colonne du fichier</th>
                  <th className="pb-2">Champ CRM</th>
                  <th className="pb-2 pl-4">Aperçu (1ère ligne)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {headers.map((header) => (
                  <tr key={header}>
                    <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">{header}</td>
                    <td className="py-2">
                      <select
                        value={mapping[header] || ""}
                        onChange={(e) =>
                          setMapping((prev) => ({ ...prev, [header]: e.target.value }))
                        }
                        className={inputClass}
                      >
                        <option value="">— Ignorer —</option>
                        {fields.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}{f.required ? " *" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pl-4 text-gray-500 truncate max-w-[200px]">
                      {String(rawRows[0]?.[header] ?? "").substring(0, 60)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Champs obligatoires manquants */}
          {(() => {
            const mapped = new Set(Object.values(mapping).filter(Boolean));
            const missing = fields.filter((f) => f.required && !mapped.has(f.key));
            if (missing.length === 0) return null;
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Champ{missing.length > 1 ? "s" : ""} obligatoire{missing.length > 1 ? "s" : ""} non mappé{missing.length > 1 ? "s" : ""} : <strong>{missing.map((f) => f.label).join(", ")}</strong></span>
              </div>
            );
          })()}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("preview")}
              disabled={fields.filter((f) => f.required).some(
                (f) => !Object.values(mapping).includes(f.key)
              )}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              Voir l'aperçu ({mappedRows.length} ligne{mappedRows.length > 1 ? "s" : ""} valides)
            </button>
            <button onClick={() => setStep("upload")} className="bg-white text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
              Retour
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 4 : Aperçu ── */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Aperçu — {mappedRows.length} enregistrement{mappedRows.length > 1 ? "s" : ""} à importer
              </h2>
              <span className="text-xs text-gray-400">Affichage des 10 premières lignes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {fields.filter((f) => Object.values(mapping).includes(f.key)).map((f) => (
                      <th key={f.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {f.label}{f.required ? " *" : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mappedRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {fields.filter((f) => Object.values(mapping).includes(f.key)).map((f) => (
                        <td key={f.key} className="px-4 py-2 text-gray-700 max-w-[200px] truncate">
                          {row[f.key] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mappedRows.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 border-t border-gray-200">
                + {mappedRows.length - 10} autres lignes non affichées
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
            >
              {importing ? (
                <><RefreshCw size={15} className="animate-spin" />Import en cours…</>
              ) : (
                <><Upload size={15} />Importer {mappedRows.length} {importType}</>
              )}
            </button>
            <button onClick={() => setStep("mapping")} className="bg-white text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
              Modifier le mapping
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 5 : Résultat ── */}
      {step === "result" && result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Import terminé</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-800">{result.created}</div>
                  <div className="text-sm text-green-700">créé{result.created > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <RefreshCw size={24} className="text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-800">{result.updated}</div>
                  <div className="text-sm text-blue-700">mis à jour</div>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium text-red-800">
                  <AlertCircle size={16} />
                  {result.errors.length} avertissement{result.errors.length > 1 ? "s" : ""}
                </div>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <X size={12} className="flex-shrink-0 mt-0.5" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/${importType}`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Voir les {importType}
            </button>
            <button onClick={reset} className="bg-white text-gray-700 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
              Nouvel import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
