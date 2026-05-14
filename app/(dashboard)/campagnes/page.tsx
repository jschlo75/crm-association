"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Mail, Plus, Send, FileText } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

type Campagne = {
  id: string;
  nom: string;
  sujet: string;
  statut: "BROUILLON" | "ENVOYEE";
  dateEnvoi: string | null;
  nbDestinataires: number;
  user: { nom: string };
  _count: { destinataires: number };
  createdAt: string;
};

export default function CampagnesPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campagnes")
      .then((r) => r.json())
      .then((d) => { setCampagnes(d); setLoading(false); });
  }, []);

  const brouillons = campagnes.filter((c) => c.statut === "BROUILLON");
  const envoyees = campagnes.filter((c) => c.statut === "ENVOYEE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campagnes email</h1>
        {(role === "ADMIN" || role === "RESTREINT") && (
          <Link
            href="/campagnes/nouvelle"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouvelle campagne
          </Link>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
      ) : campagnes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Mail size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune campagne pour le moment</p>
          {(role === "ADMIN" || role === "RESTREINT") && (
            <Link href="/campagnes/nouvelle" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Créer la première campagne
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Brouillons */}
          {brouillons.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText size={14} />
                Brouillons ({brouillons.length})
              </h2>
              <div className="space-y-3">
                {brouillons.map((c) => (
                  <CampagneCard key={c.id} campagne={c} />
                ))}
              </div>
            </section>
          )}

          {/* Envoyées */}
          {envoyees.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Send size={14} />
                Envoyées ({envoyees.length})
              </h2>
              <div className="space-y-3">
                {envoyees.map((c) => (
                  <CampagneCard key={c.id} campagne={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CampagneCard({ campagne }: { campagne: Campagne }) {
  const isEnvoyee = campagne.statut === "ENVOYEE";
  return (
    <Link
      href={`/campagnes/${campagne.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isEnvoyee ? "bg-green-100" : "bg-amber-100"
          }`}>
            {isEnvoyee
              ? <Send size={18} className="text-green-600" />
              : <FileText size={18} className="text-amber-600" />
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">{campagne.nom}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                isEnvoyee
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {isEnvoyee ? "Envoyée" : "Brouillon"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 truncate">Objet : {campagne.sujet}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 text-sm text-gray-500">
          <div className="font-medium text-gray-700">
            {campagne._count.destinataires} destinataire{campagne._count.destinataires > 1 ? "s" : ""}
          </div>
          {isEnvoyee && campagne.dateEnvoi ? (
            <div className="text-xs mt-0.5">Envoyée le {formatDate(campagne.dateEnvoi)}</div>
          ) : (
            <div className="text-xs mt-0.5">Créée le {formatDate(campagne.createdAt)}</div>
          )}
          <div className="text-xs text-gray-400 mt-0.5">par {campagne.user.nom}</div>
        </div>
      </div>
    </Link>
  );
}
