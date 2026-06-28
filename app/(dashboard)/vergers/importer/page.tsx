"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Download, CheckCircle, AlertCircle, Leaf } from "lucide-react";
import Link from "next/link";

export default function ImporterVergerPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; id?: string; nom?: string } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/vergers/import", { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok) {
      setResult({ ok: true, message: `Verger "${data.nom}" importé avec succès.`, id: data.id, nom: data.nom });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      setResult({ ok: false, message: data.error || "Une erreur est survenue." });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Leaf size={22} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importer un verger</h1>
          <p className="text-sm text-gray-500">Depuis un fichier Excel au format template</p>
        </div>
      </div>

      {/* Étape 1 — Télécharger le template */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Étape 1 — Télécharger le fichier template</h2>
        <p className="text-sm text-gray-500">
          Transmettez ce fichier au propriétaire du verger. Il devra remplir les deux onglets : <strong>Verger</strong> (informations générales) et <strong>Arbres</strong> (tableau des espèces).
        </p>
        <a
          href="/api/vergers/template"
          download
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          Télécharger le template Excel
        </a>
      </div>

      {/* Étape 2 — Importer le fichier rempli */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Étape 2 — Importer le fichier rempli</h2>
        <p className="text-sm text-gray-500">
          Une fois le fichier complété par le propriétaire, importez-le ici pour créer le verger automatiquement.
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
        >
          <FileUp size={32} className="mx-auto mb-2 text-gray-400" />
          {file ? (
            <p className="text-sm font-medium text-green-700">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Cliquez pour sélectionner un fichier</p>
              <p className="text-xs text-gray-400 mt-1">Fichier Excel (.xlsx) uniquement</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {result && (
          <div className={`flex items-start gap-2 px-4 py-3 rounded-lg text-sm border ${
            result.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {result.ok
              ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
            <div>
              <p>{result.message}</p>
              {result.ok && result.id && (
                <Link href={`/vergers/${result.id}`} className="underline font-medium mt-1 inline-block">
                  Voir la fiche du verger →
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <FileUp size={16} />
            {loading ? "Import en cours..." : "Importer"}
          </button>
          <Link
            href="/vergers"
            className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}
