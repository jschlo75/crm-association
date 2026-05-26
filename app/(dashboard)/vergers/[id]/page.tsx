import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Trees, MapPin, Pencil, Trash2, Building2, User, Hash, Leaf, GitBranch } from "lucide-react";
import { AddressMap } from "@/components/ui/address-map";
import { DeleteVergerButton } from "./delete-button";

export default async function VergerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const verger = await prisma.verger.findUnique({
    where: { id },
    include: {
      responsableOrganisation: true,
      responsableContact: true,
    },
  });
  if (!verger) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
            <Trees size={28} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{verger.nom}</h1>
            {(verger.codePostal || verger.ville) && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <MapPin size={13} />
                <span>{[verger.codePostal, verger.ville].filter(Boolean).join(" ")}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/vergers/${id}/modifier`}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil size={15} />
            Modifier
          </Link>
          <DeleteVergerButton id={verger.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Localisation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Localisation</h2>
          {(verger.adresse || verger.ville) ? (
            <AddressMap
              adresse={verger.adresse}
              codePostal={verger.codePostal}
              ville={verger.ville}
              pays={verger.pays}
            />
          ) : (
            <p className="text-sm text-gray-400">Aucune adresse renseignée.</p>
          )}
        </div>

        {/* Informations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Informations</h2>

          {/* Responsable */}
          {verger.responsableType && (verger.responsableOrganisation || verger.responsableContact) && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Responsable</p>
              {verger.responsableType === "ORGANISATION" && verger.responsableOrganisation && (
                <Link
                  href={`/organisations/${verger.responsableOrganisation.id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Building2 size={14} className="text-gray-400" />
                  {verger.responsableOrganisation.nom}
                </Link>
              )}
              {verger.responsableType === "CONTACT" && verger.responsableContact && (
                <Link
                  href={`/contacts/${verger.responsableContact.id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <User size={14} className="text-gray-400" />
                  {verger.responsableContact.prenom} {verger.responsableContact.nom}
                </Link>
              )}
            </div>
          )}

          {/* Nombre d'arbres */}
          {verger.nbArbres != null && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre d'arbres</p>
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <Hash size={14} className="text-gray-400" />
                <span>{verger.nbArbres} arbre{verger.nbArbres > 1 ? "s" : ""}</span>
              </div>
            </div>
          )}

          {/* Espèces / Variétés */}
          {verger.especesVarietes && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Espèces / Variétés</p>
              <div className="flex items-start gap-2 text-sm text-gray-800">
                <Leaf size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap">{verger.especesVarietes}</p>
              </div>
            </div>
          )}

          {/* Formes d'espalier */}
          {verger.formesEspalier && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Formes d'espalier</p>
              <div className="flex items-start gap-2 text-sm text-gray-800">
                <GitBranch size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap">{verger.formesEspalier}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {verger.notes && (
            <div className="pt-3 border-t border-gray-100 space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{verger.notes}</p>
            </div>
          )}

          {!verger.nbArbres && !verger.especesVarietes && !verger.formesEspalier && !verger.notes && !verger.responsableType && (
            <p className="text-sm text-gray-400">Aucune information renseignée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
