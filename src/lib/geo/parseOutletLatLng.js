/**
 * Normalize outlets.location from Supabase (GeoJSON-ish, plain {lat,lng}, JSON string, EWKT/WKT).
 * @param {unknown} location
 * @returns {{ lat: number, lng: number } | null}
 */

/** WKT / EWKT TEXT some PostgREST + geography columns return */
function parseWktPointEwkt(raw) {
  const s = String(raw).trim();
  const m =
    /^SRID=\d+;\s*POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i.exec(s) ||
    /^POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i.exec(s);
  if (!m) return null;
  const lng = parseFloat(m[1], 10);
  const lat = parseFloat(m[2], 10);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

export function parseOutletLatLng(location) {
  if (location == null) return null;

  if (typeof location === 'string') {
    const wkt = parseWktPointEwkt(location);
    if (wkt) return wkt;

    try {
      return parseOutletLatLng(JSON.parse(location));
    } catch {
      return null;
    }
  }

  const value = location;

  if (typeof value !== 'object' || value === null) return null;

  const latRaw = value.lat ?? value.latitude;
  const lngRaw = value.lng ?? value.longitude;
  const lat = typeof latRaw === 'number' ? latRaw : parseFloat(latRaw, 10);
  const lng = typeof lngRaw === 'number' ? lngRaw : parseFloat(lngRaw, 10);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  const c = value.coordinates;
  if (Array.isArray(c) && c.length >= 2) {
    const lng2 = typeof c[0] === 'number' ? c[0] : parseFloat(c[0], 10);
    const lat2 = typeof c[1] === 'number' ? c[1] : parseFloat(c[1], 10);
    if (Number.isFinite(lat2) && Number.isFinite(lng2)) {
      return { lat: lat2, lng: lng2 };
    }
  }

  if (value?.type === 'Point' && Array.isArray(value?.coordinates)) {
    const lng2 = parseFloat(value.coordinates[0], 10);
    const lat2 = parseFloat(value.coordinates[1], 10);
    if (Number.isFinite(lat2) && Number.isFinite(lng2)) return { lat: lat2, lng: lng2 };
  }

  return null;
}
