'use client';

import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface MiniMapaProps {
  lat: number;
  lng: number;
  localName?: string | null;
}

export function MiniMapa({ lat, lng, localName }: MiniMapaProps) {
  // Bounding box para OpenStreetMap (+/- 0.003 graus dá um bom zoom urbano)
  const delta = 0.003;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const externalOsmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <span className="truncate">{localName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 text-[11px]"
            title="Abrir no Google Maps"
          >
            Google Maps
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
      <div className="relative w-full h-32 bg-slate-900">
        <iframe
          title="Localização do abastecimento"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={embedUrl}
          className="w-full h-full opacity-90 contrast-125 saturate-150 filter"
          loading="lazy"
        />
      </div>
    </div>
  );
}
export default MiniMapa;
