import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Leaf, MapPin, Pencil, Building2, User, CalendarDays,
  Phone, Users, FlaskConical, Droplets, Globe, Target, BookOpen, TreePine,
} from "lucide-react";
import { AddressMap } from "@/components/ui/address-map";
import { DeleteVergerButton } from "./delete-button";

export default async function VergerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!["ADMIN", "RESTREINT"].includes(role)) redirect("/dashboard");

  const { id } = await params;
  const verger = await prisma.verger.findUnique({
    where: { id },
    include: {
      responsableOrganisation: true,
      responsableContact: true,
      arbres: { orderBy: { ordre: "asc" } },
    },
  });
  if (!verger) notFound();

  const labelClass = "text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
  const valueClass = "text-sm text-gray-800";

  function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
    if (!value && value !== 0) return null;
    return (
      <div>
        <p className={labelClass}>{label}</p>
        <p className={valueClass}>{value}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
            <Leaf size={28} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{verger.nom}</h1>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              {(verger.codePostal || verger.ville) && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={13} />
                  {[verger.codePostal, verger.ville].filter(Boolean).join(" ")}
                </span>
              )}
              {verger.ouvertPublic && (
                <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  <Globe size={11} />Ouvert au public
                </span>
              )}
            </div>
          </div>
        </div>
        {["ADMIN", "RESTREINT"].includes(role) && (
          <div className="flex items-center gap-2">
            <Link
              href={`/vergers/${id}/modifier`}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Pencil size={15} />
              Modifier
            </Link>
            {role === "ADMIN" && <DeleteVergerButton id={verger.id} />}
          </div>
        )}
      </div>

      {/* Localisation */}
      {(verger.adresse || verger.ville) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Localisation</h2>
          <AddressMap adresse={verger.adresse} codePostal={verger.codePostal} ville={verger.ville} pays={verger.pays} />
        </div>
      )}

      {/* Identité */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Leaf size={16} className="text-green-500" />Identité
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="Propriétaire" value={verger.proprietaire} />
          <InfoItem label="Exploitant" value={verger.exploitant} />
          <InfoItem label="Année de création" value={verger.anneeCreation} />
          <InfoItem label="Année de conversion en bio" value={verger.anneeConversion} />
          {verger.contact && (
            <div className="sm:col-span-2">
              <p className={labelClass}>Contact</p>
              <div className="flex items-start gap-2 text-sm text-gray-800">
                <Phone size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{verger.contact}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caractéristiques */}
      {(verger.superficie || verger.sol || verger.ph || verger.pluviometrie || verger.moisDeficit) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FlaskConical size={16} className="text-blue-500" />Caractéristiques
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {verger.superficie && <InfoItem label="Superficie" value={`${verger.superficie} m²`} />}
            <InfoItem label="Sol" value={verger.sol} />
            {verger.ph && <InfoItem label="pH" value={verger.ph} />}
            {verger.pluviometrie && (
              <div>
                <p className={labelClass}>Pluviométrie annuelle</p>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <Droplets size={13} className="text-gray-400" />
                  <span>{verger.pluviometrie} mm</span>
                </div>
              </div>
            )}
            <InfoItem label="Mois de déficit hydrique" value={verger.moisDeficit} />
          </div>
        </div>
      )}

      {/* Certifications & Objectifs */}
      {(verger.certifications || verger.objectifs) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={16} className="text-purple-500" />Certifications & Objectifs
          </h2>
          <div className="space-y-4">
            {verger.certifications && (
              <div>
                <p className={labelClass}>Certifications, signes de qualité, labellisations</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{verger.certifications}</p>
              </div>
            )}
            {verger.objectifs && (
              <div>
                <p className={labelClass}>Objectifs du verger</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{verger.objectifs}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Personnel & Activités */}
      {(verger.personnelEmployes || verger.personnelBenevoles || verger.activitesFormation || verger.autresActivites) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={16} className="text-orange-500" />Personnel & Activités
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem label="Personnes employées" value={verger.personnelEmployes} />
            <InfoItem label="Bénévoles" value={verger.personnelBenevoles} />
            {verger.activitesFormation && (
              <div className="sm:col-span-2">
                <p className={labelClass}>Activités de formation</p>
                <div className="flex items-start gap-2 text-sm text-gray-800">
                  <BookOpen size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="whitespace-pre-wrap">{verger.activitesFormation}</p>
                </div>
              </div>
            )}
            {verger.autresActivites && (
              <div className="sm:col-span-2">
                <p className={labelClass}>Autres activités</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{verger.autresActivites}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tableau des arbres */}
      {verger.arbres.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <TreePine size={16} className="text-green-500" />
            <h2 className="font-semibold text-gray-900">Arbres ({verger.arbres.length} espèce{verger.arbres.length > 1 ? "s" : ""})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Espèce</th>
                  <th className="px-6 py-3">Nb arbres</th>
                  <th className="px-6 py-3">Variétés</th>
                  <th className="px-6 py-3">Formes de conduite</th>
                  <th className="px-6 py-3">Âge moyen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verger.arbres.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{a.espece}</td>
                    <td className="px-6 py-3 text-gray-600">{a.nbArbres ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{a.varietes || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{a.formes || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{a.ageMoyen ? `${a.ageMoyen} ans` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {verger.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{verger.notes}</p>
        </div>
      )}
    </div>
  );
}
