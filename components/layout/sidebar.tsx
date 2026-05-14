"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard, Building2, Users, MessageSquare, Mail,
  CalendarDays, FileUp, UserCog, LogOut, UserCircle, Menu, X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",    label: "Tableau de bord",  icon: LayoutDashboard },
  { href: "/organisations", label: "Organisations",      icon: Building2 },
  { href: "/contacts",     label: "Contacts",          icon: Users },
  { href: "/interactions", label: "Interactions",      icon: MessageSquare },
  { href: "/evenements",   label: "Événements",        icon: CalendarDays },
  { href: "/campagnes",    label: "Campagnes email",   icon: Mail },
];

const adminNavItems = [
  { href: "/import", label: "Importer Excel",  icon: FileUp },
  { href: "/admin",  label: "Administration",  icon: UserCog },
];

function NavLink({
  href, label, icon: Icon, exact = false,
  onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-blue-700 text-white" : "text-blue-200 hover:bg-blue-800 hover:text-white"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

export function Sidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* ── Bouton hamburger (mobile uniquement) ── */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 bg-blue-900 text-white p-2 rounded-lg shadow-md"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Backdrop mobile ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "w-64 bg-blue-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50",
          "transition-transform duration-300 ease-in-out",
          // Mobile : caché par défaut, visible si open
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop : toujours visible
          "lg:translate-x-0"
        )}
      >
        {/* En-tête */}
        <div className="px-4 py-4 border-b border-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="SNHF"
                width={44}
                height={52}
                className="block"
              />
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">Sté Nationale</p>
              <p className="text-blue-300 text-xs leading-tight">d&apos;Horticulture</p>
              <p className="text-blue-300 text-xs leading-tight">de France</p>
            </div>
          </div>
          {/* Bouton fermer (mobile) */}
          <button
            onClick={close}
            className="lg:hidden text-blue-300 hover:text-white p-1 rounded"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} onClick={close} />
          ))}

          {role === "ADMIN" && (
            <>
              <div className="border-t border-blue-800 my-2" />
              {adminNavItems.map(({ href, label, icon }) => (
                <NavLink key={href} href={href} label={label} icon={icon} onClick={close} />
              ))}
            </>
          )}
        </nav>

        {/* Bas : profil + déconnexion */}
        <div className="p-4 border-t border-blue-800 space-y-1">
          <NavLink href="/profil" label={userName || "Mon profil"} icon={UserCircle} exact onClick={close} />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
