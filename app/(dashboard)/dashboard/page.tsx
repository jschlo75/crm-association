import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Users, Newspaper, ExternalLink, AlertCircle, CalendarDays, Leaf } from "lucide-react";

/* ── API WordPress SNHF ─────────────────────────────────────── */
type ArticleSnhf = {
  titre: string;
  lien: string;
  date: string;
  extrait: string;
  image: string | null;
};

async function fetchActualitesSnhf(): Promise<ArticleSnhf[]> {
  try {
    const res = await fetch(
      "https://www.snhf.org/wp-json/wp/v2/posts?per_page=6&_embed=1",
      { next: { revalidate: 3600 } } // cache 1 heure
    );
    if (!res.ok) return [];

    const posts = await res.json();
    if (!Array.isArray(posts)) return [];

    return posts.map((post: Record<string, unknown>) => {
      const titre = (post.title as { rendered: string })?.rendered ?? "";
      const lien = (post.link as string) ?? "";
      const pubDate = (post.date as string) ?? "";
      const date = pubDate
        ? new Date(pubDate).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric",
          })
        : "";

      // Extrait : strip HTML + shortcodes WordPress ([vc_row], [vc_column...], etc.)
      const excerptRaw = (post.excerpt as { rendered: string })?.rendered ?? "";
      const extrait = excerptRaw
        .replace(/\[[\w_]+[^\]]*\]/g, "")   // shortcodes WordPress [xxx ...]
        .replace(/<[^>]+>/g, "")             // balises HTML
        .replace(/&[a-z]+;|&#\d+;/gi, " ")  // entités HTML résiduelles
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);

      // Image vignette via _embedded
      let image: string | null = null;
      try {
        const embedded = post._embedded as Record<string, unknown>;
        const media = embedded?.["wp:featuredmedia"] as Record<string, unknown>[];
        const sizes = (media?.[0]?.media_details as Record<string, unknown>)?.sizes as Record<string, { source_url: string }>;
        image =
          sizes?.medium?.source_url ||
          sizes?.thumbnail?.source_url ||
          (media?.[0]?.source_url as string) ||
          null;
      } catch {
        image = null;
      }

      return { titre, lien, date, extrait, image };
    });
  } catch {
    return [];
  }
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN";

  const [nbComptes, nbInterlocuteurs, nbEvenementsAVenir, nbVergers] = await Promise.all([
    prisma.organisation.count(),
    prisma.user.count({ where: { actif: true } }),
    prisma.evenement.count({ where: { date: { gte: new Date() } } }),
    isAdmin ? prisma.verger.count() : Promise.resolve(null),
    // fetchActualitesSnhf(), // ← décommenter pour réactiver les actualités SNHF
  ]);

  const stats = [
    { label: "Organisations",      value: nbComptes,          icon: Building2,    href: "/organisations", color: "bg-blue-600" },
    { label: "Interlocuteurs",     value: nbInterlocuteurs,   icon: Users,        href: "/admin",         color: "bg-emerald-600" },
    ...(isAdmin && nbVergers !== null
      ? [{ label: "Vergers", value: nbVergers, icon: Leaf, href: "/vergers", color: "bg-green-600" }]
      : []),
    { label: "Événements à venir", value: nbEvenementsAVenir, icon: CalendarDays, href: "/evenements",    color: "bg-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Titre */}
      <h1 className="text-2xl font-bold text-gray-900">Groupe arboriculture fruitière familiale</h1>

      {/* Statistiques */}
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
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

      {/* ── Actualités SNHF (désactivé — décommenter pour réactiver) ──
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
                  <div className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {article.image ? (
                      <img src={article.image} alt={article.titre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper size={22} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug"
                       dangerouslySetInnerHTML={{ __html: article.titre }} />
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
      ── fin Actualités SNHF ── */}
    </div>
  );
}
