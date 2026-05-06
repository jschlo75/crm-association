"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  Mail,
  CalendarDays,
  FileUp,
  UserCog,
  LogOut,
  UserCircle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/comptes", label: "Comptes", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/interactions", label: "Interactions", icon: MessageSquare },
  { href: "/evenements", label: "Événements", icon: CalendarDays },
  { href: "/campagnes", label: "Campagnes email", icon: Mail },
];

const adminNavItems = [
  { href: "/import", label: "Importer Excel", icon: FileUp },
  { href: "/admin", label: "Administration", icon: UserCog },
];

export function Sidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="px-5 py-4 border-b border-blue-800">
        <h1 className="text-base font-bold leading-tight">SNHF</h1>
        <p className="text-blue-300 text-xs mt-0.5 leading-tight">Sté Nationale d'Horticulture de France</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "bg-blue-700 text-white"
                : "text-blue-200 hover:bg-blue-800 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}

        {role === "ADMIN" && (
          <>
            <div className="border-t border-blue-800 my-2" />
            {adminNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-700 text-white"
                    : "text-blue-200 hover:bg-blue-800 hover:text-white"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-blue-800 space-y-1">
        {/* Profil utilisateur */}
        <Link
          href="/profil"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
            pathname === "/profil"
              ? "bg-blue-700 text-white"
              : "text-blue-200 hover:bg-blue-800 hover:text-white"
          )}
        >
          <UserCircle size={18} />
          <span className="truncate">{userName || "Mon profil"}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-colors w-full"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
