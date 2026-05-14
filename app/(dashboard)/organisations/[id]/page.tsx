import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2, Mail, Phone, Users, MessageSquare,
  Pencil, Plus, Trash2, ChevronsUp, GitBranch
} from "lucide-react";
import {
  formatDate, TYPE_ORGANISATION_LABELS, TYPE_INTERACTION_LABELS, TYPE_INTERACTION_ICONS
} from "@/lib/utils";
import { DeleteOrganisationButton } from "./delete-button";
import { AddressMap } from "@/components/ui/address-map";

export default async function OrganisationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  const { id } = await params;

  const organisation = await prisma.organisation.findUnique({
    where: { id },
    include: {
      parent: true,
      sousOrganisations: { orderBy: { nom: "asc" } },
      contacts: { orderBy: { nom: "asc" } },
      interactions: {
        orderBy: { date: "desc" },
        include: { contact: true, user: true },
      },
    },
  });

  if (!organisation) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organisation.nom}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {TYPE_ORGANISATION_LABELS[organisation.type]}
              </span>
              {organisation.parent && (
                <Link
                  href={`/organisations/${organisation.parent.id}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded-full"
                >
                  <ChevronsUp size={11} />
                  {organisation.parent.nom}
                </Link>
              )}
            </div>
          </div>
        </div>
        {role === "ADMIN" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/organisations/${id}/modifier`}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Pencil size={15} />
              Modifier
            </Link>
            <DeleteOrganisationButton id={organisation.id} />
          </div>
        )}
      </div>

      {/* Sous-organisations */}
      {organisation.sousOrganisations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <GitBranch size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Sous-organisations ({organisation.sousOrganisations.length})</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {organisation.sousOrganisations.map((sc) => (
              <li key={sc.id}>
                <Link
                  href={`/organisations/${sc.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{sc.nom}</div>
                    <div className="text-xs text-gray-400">{TYPE_ORGANISATION_LABELS[sc.type]}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Informations */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations</h2>
          <div className="space-y-3 text-sm">
            {organisation.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <a href={`mailto:${organisation.email}`} className="hover:text-blue-600 truncate">{organisation.email}</a>
              </div>
            )}
            {organisation.telephone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                <span>{organisation.telephone}</span>
              </div>
            )}
            {(organisation.adresse || organisation.ville) && (
              <AddressMap
                adresse={organisation.adresse}
                codePostal={organisation.codePostal}
                ville={organisation.ville}
                pays={organisation.pays}
              />
            )}
          </div>
          {organisation.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{organisation.notes}</p>
            </div>
          )}
        </div>

        {/* Contacts */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              Contacts ({organisation.contacts.length})
            </h2>
            {role === "ADMIN" && (
              <Link
                href={`/contacts/nouveau?organisationId=${organisation.id}`}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                Ajouter
              </Link>
            )}
          </div>
          {organisation.contacts.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400 text-center">Aucun contact rattaché.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {organisation.contacts.map((c) => (
                <li key={c.id}>
                  <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium flex-shrink-0">
                      {c.prenom[0]}{c.nom[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{c.prenom} {c.nom}</div>
                      {c.poste && <div className="text-xs text-gray-500">{c.poste}</div>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Interactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-400" />
            Interactions ({organisation.interactions.length})
          </h2>
          <Link
            href={`/interactions/nouvelle?organisationId=${organisation.id}`}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus size={14} />
            Ajouter
          </Link>
        </div>
        {organisation.interactions.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-400 text-center">Aucune interaction enregistrée.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {organisation.interactions.map((i) => (
              <li key={i.id} className="px-6 py-4 flex items-start gap-3">
                <span className="text-lg mt-0.5">{TYPE_INTERACTION_ICONS[i.type]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{i.sujet}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {TYPE_INTERACTION_LABELS[i.type]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>{formatDate(i.date)}</span>
                    {i.contact && (
                      <>
                        <span>·</span>
                        <Link href={`/contacts/${i.contact.id}`} className="hover:text-blue-600">
                          {i.contact.prenom} {i.contact.nom}
                        </Link>
                      </>
                    )}
                    <span>·</span>
                    <span>par {i.user.nom}</span>
                  </div>
                  {i.description && (
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{i.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
