import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, Building2, MessageSquare, Pencil, Plus, BadgeCheck, CalendarDays } from "lucide-react";
import { formatDate, TYPE_INTERACTION_LABELS, TYPE_INTERACTION_ICONS } from "@/lib/utils";
import { DeleteContactButton } from "./delete-button";
import { AddressMap } from "@/components/ui/address-map";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      compte: true,
      interactions: {
        orderBy: { date: "desc" },
        include: { compte: true, user: true },
      },
    },
  });

  if (!contact) notFound();

  const initiales = `${contact.prenom[0]}${contact.nom[0]}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
            {initiales}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact.prenom} {contact.nom}</h1>
            {contact.poste && <p className="text-gray-500 text-sm">{contact.poste}</p>}
            {contact.compte && (
              <Link href={`/comptes/${contact.compte.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                <Building2 size={13} />
                {contact.compte.nom}
              </Link>
            )}
            {contact.isMembre && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <BadgeCheck size={12} />
                Membre SNHF
              </span>
            )}
          </div>
        </div>
        {role === "ADMIN" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/contacts/${contact.id}/modifier`}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Pencil size={15} />
              Modifier
            </Link>
            <DeleteContactButton id={contact.id} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Informations */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Coordonnées</h2>
          <div className="space-y-3 text-sm">
            {contact.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-blue-600 truncate">{contact.email}</a>
              </div>
            )}
            {contact.telephone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                <span>{contact.telephone}</span>
              </div>
            )}
            {(contact.adresse || contact.ville) && (
              <AddressMap
                adresse={contact.adresse}
                codePostal={contact.codePostal}
                ville={contact.ville}
                pays={contact.pays}
              />
            )}
          </div>
          {contact.isMembre && contact.dateAdhesion && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={14} className="text-gray-400 flex-shrink-0" />
              <span>Adhésion : {formatDate(contact.dateAdhesion)}</span>
            </div>
          )}
          {contact.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Interactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-400" />
              Interactions ({contact.interactions.length})
            </h2>
            <Link
              href={`/interactions/nouvelle?contactId=${contact.id}`}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus size={14} />
              Ajouter
            </Link>
          </div>
          {contact.interactions.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400 text-center">Aucune interaction enregistrée.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {contact.interactions.map((i) => (
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
                      {i.compte && (
                        <>
                          <span>·</span>
                          <Link href={`/comptes/${i.compte.id}`} className="hover:text-blue-600">
                            {i.compte.nom}
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
    </div>
  );
}
