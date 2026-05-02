'use client';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

/** Resolve Next/static asset import or URL string */
function assetUrl(mod) {
  if (typeof mod === 'string') return mod;
  if (mod && typeof mod === 'object' && typeof mod.src === 'string') return mod.src;
  return String(mod ?? '');
}

let fixed = false;

/**
 * Leaflet defaults assume wrong paths after bundling. Call once before rendering Markers (client-only).
 */
export function fixLeafletDefaultIcons() {
  if (fixed || typeof window === 'undefined') return;
  fixed = true;
  if (L.Icon.Default.prototype._getIconUrl) {
    delete L.Icon.Default.prototype._getIconUrl;
  }
  L.Icon.Default.mergeOptions({
    iconUrl: assetUrl(markerIcon),
    iconRetinaUrl: assetUrl(markerIcon2x),
    shadowUrl: assetUrl(markerShadow),
  });
}
