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

export const TYPE_COMPTE_LABELS: Record<string, string> = {
  ENTREPRISE: "Entreprise",
  ASSOCIATION: "Association",
  COLLECTIVITE: "Collectivité",
  PARTICULIER: "Particulier",
  AUTRE: "Autre",
};

export const TYPE_INTERACTION_ICONS: Record<string, string> = {
  APPEL: "📞",
  EMAIL: "✉️",
  REUNION: "🤝",
};
