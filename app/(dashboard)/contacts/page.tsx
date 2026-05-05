"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Users, Plus, Search, ChevronRight } from "lucide-react";

type Contact = {
  id: string;
  prenom: string;
  nom: string;
  poste: string | null;
  email: string | null;
  ville: string | null;
  compte: { id: string; nom: string } | null;
  _count: { interactions: number };
};

export default function ContactsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role: string })?.role;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/contacts?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data) => { setContacts(data); setLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        {role === "ADMIN" && (
          <Link
            href="/contacts/nouveau"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouveau contact
          </Link>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un contact (nom, prénom, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {search ? "Aucun contact trouvé." : "Aucun contact pour le moment."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/contacts/${contact.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                    {contact.prenom[0]}{contact.nom[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {contact.prenom} {contact.nom}
                      </span>
                      {contact.poste && (
                        <span className="text-xs text-gray-500">— {contact.poste}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
                      {contact.compte && (
                        <span className="text-blue-600">{contact.compte.nom}</span>
                      )}
                      {contact.email && <span>{contact.email}</span>}
                      <span>{contact._count.interactions} interaction{contact._count.interactions > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
