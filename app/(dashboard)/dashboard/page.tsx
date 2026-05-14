import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, TYPE_INTERACTION_LABELS, TYPE_INTERACTION_ICONS, TYPE_ORGANISATION_LABELS } from "@/lib/utils";
import Link from "next/link";
import { Building2, Users, MessageSquare, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id;

  const [nbComptes, nbContacts, nbInteractions, dernieresInteractions] = await Promise.all([
    prisma.organisation.count(),
    prisma.contact.count(),
    prisma.interaction.count(),
    prisma.interaction.findMany({
      take: 8,
      orderBy: { date: "desc" },
      include: { organisation: true, contact: true, user: true },
    }),
  ]);

  const stats = [
    { label: "Organisations", value: nbComptes, icon: Building2, href: "/organisations", color: "bg-blue-600" },
    { label: "Contacts", value: nbContacts, icon: Users, href: "/contacts", color: "bg-emerald-600" },
    { label: "Interactions", value: nbInteractions, icon: MessageSquare, href: "/interactions", color: "bg-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="flex gap-2">
          <Link
            href="/interactions/nouvelle"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouvelle interaction
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`${color} p-3 rounded-xl flex-shrink-0`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Dernières interactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Dernières interactions</h2>
          <Link href="/interactions" className="text-sm text-blue-600 hover:underline">
            Voir tout
          </Link>
        </div>

        {dernieresInteractions.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">
            Aucune interaction pour le moment.{" "}
            <Link href="/interactions/nouvelle" className="text-blue-600 hover:underline">
              Ajouter la première
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {dernieresInteractions.map((interaction) => (
              <li key={interaction.id} className="px-6 py-4 flex items-start gap-4">
                <span className="text-xl mt-0.5">
                  {TYPE_INTERACTION_ICONS[interaction.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{interaction.sujet}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {TYPE_INTERACTION_LABELS[interaction.type]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{formatDate(interaction.date)}</span>
                    {interaction.contact && (
                      <>
                        <span>·</span>
                        <Link href={`/contacts/${interaction.contact.id}`} className="hover:text-blue-600">
                          {interaction.contact.prenom} {interaction.contact.nom}
                        </Link>
                      </>
                    )}
                    {interaction.organisation && (
                      <>
                        <span>·</span>
                        <Link href={`/organisations/${interaction.organisation.id}`} className="hover:text-blue-600">
                          {interaction.organisation.nom}
                        </Link>
                      </>
                    )}
                    <span>·</span>
                    <span>par {interaction.user.nom}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
