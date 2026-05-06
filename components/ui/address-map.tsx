"use client";

import { MapPin, ExternalLink } from "lucide-react";

interface AddressMapProps {
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  pays?: string | null;
}

export function AddressMap({ adresse, codePostal, ville, pays }: AddressMapProps) {
  const parts = [adresse, codePostal, ville, pays].filter(Boolean);
  if (parts.length === 0) return null;

  const query = encodeURIComponent(parts.join(", "));
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed&hl=fr`;
  const linkUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            {adresse && <div>{adresse}</div>}
            {(codePostal || ville) && (
              <div>{codePostal} {ville}</div>
            )}
            {pays && pays !== "France" && <div>{pays}</div>}
          </div>
        </div>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline flex-shrink-0 ml-2"
        >
          <ExternalLink size={12} />
          Ouvrir
        </a>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200 w-full h-48">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Carte"
        />
      </div>
    </div>
  );
}
