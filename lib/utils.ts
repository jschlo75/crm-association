import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "d MMMM yyyy", { locale: fr });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "d MMM yyyy à HH:mm", { locale: fr });
}

export const TYPE_INTERACTION_LABELS: Record<string, string> = {
  APPEL: "Appel téléphonique",
  EMAIL: "Email",
  REUNION: "Réunion",
};

export const TYPE_ORGANISATION_LABELS: Record<string, string> = {
  ENSEIGNEMENT: "Enseignement",
  ASSOCIATION: "Association",
  FEDERATION: "Fédération",
  JARDIN_PRIVE: "Jardin privé",
  ORGANISME_PUBLIC: "Organisme public",
};

export const TYPE_INTERACTION_ICONS: Record<string, string> = {
  APPEL: "📞",
  EMAIL: "✉️",
  REUNION: "🤝",
};

export const STATUT_PARTICIPANT_LABELS: Record<string, string> = {
  CIBLE:      "Ciblé",
  INVITE:     "Invité",
  A_ACCEPTE:  "A accepté",
  A_PARTICIPE:"A participé",
  A_REFUSE:   "A refusé",
};

export const STATUT_PARTICIPANT_COLORS: Record<string, string> = {
  CIBLE:       "bg-gray-100 text-gray-600",
  INVITE:      "bg-blue-100 text-blue-700",
  A_ACCEPTE:   "bg-emerald-100 text-emerald-700",
  A_PARTICIPE: "bg-green-100 text-green-800",
  A_REFUSE:    "bg-red-100 text-red-700",
};
