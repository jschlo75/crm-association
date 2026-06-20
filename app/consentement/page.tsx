"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Leaf, CheckCircle2 } from "lucide-react";

type Organisation = { id: string; nom: string };

export default function ConsentementPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [organisationId, setOrganisationId] = useState("");
  const [consentementPartage, setConsentementPartage] = useState(false);
  const [consentementEmails, setConsentementEmails] = useState(false);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/profil").then((r) => r.json()),
      fetch("/api/organisations?limit=9999").then((r) => r.json()),
    ]).then(([profil, orgs]) => {
      setPrenom(profil.prenom ?? "");
      setNom(profil.nom ?? "");
      setOrganisationId(profil.organisationId ?? "");
      setConsentementPartage(profil.consentementPartageContacts ?? false);
      setConsentementEmails(profil.consentementEmailsInfo ?? false);
      setOrganisations(Array.isArray(orgs) ? orgs : (orgs.data ?? []));
    });
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentementPartage) {
      setError("Vous devez accepter de partager vos informations de contact pour accéder au site.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/consentement", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom, nom, organisationId: organisationId || null, consentementPartageContacts: consentementPartage, consentementEmailsInfo: consentementEmails }),
    });

    if (res.ok) {
      // Forcer le renouvellement du token JWT via update de session
      await update();
      // Redirection forcée pour que le middleware relise le token
      window.location.href = "/dashboard";
    } else {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* En-tête */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
            <Leaf size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Groupe d'arboriculture fruitière familiale
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Bienvenue sur le site de partage du groupe d'arboriculture fruitière familiale.<br />
            Pour accéder aux informations, merci de valider vos informations de contact et accepter de les partager avec les autres utilisateurs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Informations */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Vos informations</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Prénom</label>
                  <input
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className={inputClass}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className={labelClass}>Nom *</label>
                  <input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Organisation</label>
                <select
                  value={organisationId}
                  onChange={(e) => setOrganisationId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Sélectionner votre organisation —</option>
                  {organisations.map((o) => (
                    <option key={o.id} value={o.id}>{o.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Consentements */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Consentements</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentementPartage}
                  onChange={(e) => setConsentementPartage(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                    J'accepte de partager mes informations de contact *
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vos nom, prénom et organisation seront visibles par les autres membres du groupe. Ce consentement est requis pour accéder au site.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentementEmails}
                  onChange={(e) => setConsentementEmails(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                    J'accepte de recevoir les emails d'information du groupe
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Newsletters et actualités du groupe d'arboriculture fruitière familiale. Facultatif.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !consentementPartage}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Validation..." : (
              <>
                <CheckCircle2 size={16} />
                Valider et accéder au site
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Si vous ne souhaitez pas partager vos informations, vous ne pourrez pas accéder au site. Vous pourrez modifier vos préférences à tout moment depuis votre profil.
          </p>
        </form>
      </div>
    </div>
  );
}
