import { NextResponse } from 'next/server';

const FALLBACK_LOCATIONS = [
  { label: 'Colombo 07, Sri Lanka', lat: 6.9147, lng: 79.8655 },
  { label: 'Colombo 03, Sri Lanka', lat: 6.9022, lng: 79.8534 },
  { label: 'Colombo 05, Sri Lanka', lat: 6.8953, lng: 79.8588 },
  { label: 'Nugegoda, Sri Lanka', lat: 6.8649, lng: 79.8997 },
  { label: 'Dehiwala, Sri Lanka', lat: 6.8528, lng: 79.8657 },
  { label: 'Kandy, Sri Lanka', lat: 7.2906, lng: 80.6337 },
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query) {
    return NextResponse.json({ results: FALLBACK_LOCATIONS.slice(0, 5) });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    try {
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
      nominatimUrl.searchParams.set('q', `${query}, Sri Lanka`);
      nominatimUrl.searchParams.set('format', 'jsonv2');
      nominatimUrl.searchParams.set('limit', '5');
      nominatimUrl.searchParams.set('countrycodes', 'lk');

      const response = await fetch(nominatimUrl.toString(), {
        cache: 'no-store',
        headers: { 'User-Agent': 'fresh-as-ever-location-search/1.0' },
      });
      const rows = await response.json();
      const results = (rows || []).map((item) => ({
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

      if (results.length > 0) {
        return NextResponse.json({ results });
      }
    } catch (_error) {
      // Fall back to static locations
    }

    const lowered = query.toLowerCase();
    const filtered = FALLBACK_LOCATIONS.filter((location) => location.label.toLowerCase().includes(lowered));
    const results = filtered.length > 0 ? filtered.slice(0, 5) : FALLBACK_LOCATIONS.slice(0, 5);
    return NextResponse.json({ results });
  }

  try {
    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.set('address', query);
    geocodeUrl.searchParams.set('components', 'country:LK');
    geocodeUrl.searchParams.set('key', apiKey);

    const response = await fetch(geocodeUrl.toString(), { cache: 'no-store' });
    const data = await response.json();

    const results = (data?.results || []).slice(0, 5).map((item) => ({
      label: item.formatted_address,
      lat: item.geometry?.location?.lat,
      lng: item.geometry?.location?.lng,
    })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    return NextResponse.json({ results });
  } catch (_error) {
    return NextResponse.json({ results: FALLBACK_LOCATIONS.slice(0, 5) });
  }
}
