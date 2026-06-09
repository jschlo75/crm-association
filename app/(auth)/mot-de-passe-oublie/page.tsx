"use client";

import { useState } from "react";
import { LOGO_B64 } from "@/lib/logo-base64";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/mot-de-passe-oublie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setSent(true);
    } else {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-blue-800">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_B64} alt="SNHF" style={{ width: "120px", height: "auto" }} />
          </div>
          <p className="text-gray-500 mt-1 text-xs font-medium">Société Nationale d&apos;Horticulture de France</p>
          <h1 className="text-gray-800 mt-4 text-lg font-semibold">Mot de passe oublié</h1>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-sm text-center">
              Si cette adresse email est enregistrée, vous allez recevoir un lien de réinitialisation dans quelques instants.
            </div>
            <a
              href="/login"
              className="block text-center text-sm text-blue-600 hover:underline mt-2"
            >
              ← Retour à la connexion
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Saisissez votre adresse email pour recevoir un lien de réinitialisation.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="vous@exemple.fr"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </button>

            <div className="text-center">
              <a href="/login" className="text-sm text-blue-600 hover:underline">
                ← Retour à la connexion
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
