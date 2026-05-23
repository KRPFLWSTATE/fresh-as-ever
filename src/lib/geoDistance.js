import { parseOutletLatLng } from '@/lib/geo/parseOutletLatLng';
import { haversineKm } from '@/lib/utils';

export { parseOutletLatLng };

/**
 * @param {number} km
 * @returns {string}
 */
export function formatDistanceLabel(km) {
  if (!Number.isFinite(km) || km < 0) return 'Distance unavailable';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * @param {{ lat: number, lng: number } | null} userCoords
 * @param {unknown} outletLocation
 * @returns {string}
 */
export function distanceLabelFromOutlet(userCoords, outletLocation) {
  if (!userCoords) return 'Distance unavailable';
  const outletCoords = parseOutletLatLng(outletLocation);
  if (!outletCoords) return 'Distance unavailable';
  return formatDistanceLabel(
    haversineKm(userCoords.lat, userCoords.lng, outletCoords.lat, outletCoords.lng),
  );
}
