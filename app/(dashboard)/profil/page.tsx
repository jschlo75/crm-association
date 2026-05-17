"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";

type Message = { type: "success" | "error"; text: string };

export default function ProfilPage() {
  const { data: session, update: updateSession } = useSession();
  const role = (session?.user as { role: string })?.role;

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [ancienMotDePasse, setAncienMotDePasse] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmMotDePasse, setConfirmMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Charger les données actuelles
  useEffect(() => {
    fetch("/api/profil")
      .then((r) => r.json())
      .then((data) => {
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setEmail(data.email || "");
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (nouveauMotDePasse && nouveauMotDePasse !== confirmMotDePasse) {
      setMessage({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }

    setLoading(true);
    const res = await fetch("/api/profil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom,
        nom,
        email,
        ancienMotDePasse: ancienMotDePasse || undefined,
        nouveauMotDePasse: nouveauMotDePasse || undefined,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: "Profil mis à jour avec succès." });
      setAncienMotDePasse("");
      setNouveauMotDePasse("");
      setConfirmMotDePasse("");
      // Rafraîchir la session NextAuth pour mettre à jour le nom affiché
      await updateSession();
    } else {
      setMessage({ type: "error", text: data.error || "Une erreur est survenue." });
    }
    setLoading(false);
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const initiales = prenom && nom
    ? `${prenom[0]}${nom[0]}`.toUpperCase()
    : nom
    ? nom[0].toUpperCase()
    : "?";

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      {/* Avatar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0">
          {initiales}
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-lg">
            {prenom ? `${prenom} ${nom}` : nom}
          </div>
          <div className="text-sm text-gray-500">{email}</div>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
          }`}>
            {role === "ADMIN" ? "Administrateur" : "Membre"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {message.type === "success"
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Identité */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            Identité
          </h2>
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mail size={16} className="text-gray-400" />
            Adresse email
          </h2>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Lock size={16} className="text-gray-400" />
            Changer le mot de passe
            <span className="text-xs font-normal text-gray-400">(optionnel)</span>
          </h2>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Mot de passe actuel</label>
              <input
                type="password"
                value={ancienMotDePasse}
                onChange={(e) => setAncienMotDePasse(e.target.value)}
                className={inputClass}
                placeholder="Requis pour changer le mot de passe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)}
                  minLength={8}
                  className={inputClass}
                  placeholder="8 caractères minimum"
                />
              </div>
              <div>
                <label className={labelClass}>Confirmer</label>
                <input
                  type="password"
                  value={confirmMotDePasse}
                  onChange={(e) => setConfirmMotDePasse(e.target.value)}
                  className={inputClass}
                  placeholder="Répéter le mot de passe"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
