import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Users, Newspaper, ExternalLink, AlertCircle } from "lucide-react";

/* ── Parsing RSS SNHF ───────────────────────────────────────── */
type ArticleSnhf = {
  titre: string;
  lien: string;
  date: string;
  extrait: string;
};

function extraire(xml: string, balise: string): string {
  const re = new RegExp(`<${balise}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${balise}>`, "s");
  return (xml.match(re)?.[1] ?? "").trim();
}

async function fetchActualitesSnhf(): Promise<ArticleSnhf[]> {
  try {
    const res = await fetch("https://www.snhf.org/category/actualites/feed/", {
      next: { revalidate: 3600 }, // cache 1 heure
    });
    if (!res.ok) return [];
    const xml = await res.text();

    // Extraire chaque <item>
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

    return items.slice(0, 6).map((item) => {
      const titre = extraire(item, "title");
      const lien = extraire(item, "link") || extraire(item, "guid");
      const pubDate = extraire(item, "pubDate");
      const description = extraire(item, "description")
        .replace(/<[^>]+>/g, "") // strip HTML
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);

      const date = pubDate
        ? new Date(pubDate).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric",
          })
        : "";

      return { titre, lien, date, extrait: description };
    });
  } catch {
    return [];
  }
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  void session; // session disponible si besoin futur

  const [nbComptes, nbContacts, actualites] = await Promise.all([
    prisma.organisation.count(),
    prisma.contact.count(),
    fetchActualitesSnhf(),
  ]);

  const stats = [
    { label: "Organisations", value: nbComptes, icon: Building2, href: "/organisations", color: "bg-blue-600" },
    { label: "Contacts",      value: nbContacts, icon: Users,    href: "/contacts",      color: "bg-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Titre */}
      <h1 className="text-2xl font-bold text-gray-900">Groupe arboriculture fruitière familiale</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
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

      {/* Actualités SNHF */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Newspaper size={17} className="text-blue-600" />
            Actualités SNHF
          </h2>
          <a
            href="https://www.snhf.org/category/actualites/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            Voir tout
            <ExternalLink size={13} />
          </a>
        </div>

        {actualites.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
            <AlertCircle size={20} className="text-gray-300" />
            Impossible de charger les actualités pour le moment.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {actualites.map((article, i) => (
              <li key={i}>
                <a
                  href={article.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mt-0.5">
                    <Newspaper size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                      {article.titre}
                    </p>
                    {article.extrait && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.extrait}</p>
                    )}
                    {article.date && (
                      <p className="text-xs text-gray-400 mt-1">{article.date}</p>
                    )}
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
