import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ label: 'Current location' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ label: `Current location (${lat.toFixed(3)}, ${lng.toFixed(3)})` });
  }

  try {
    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.set('latlng', `${lat},${lng}`);
    geocodeUrl.searchParams.set('key', apiKey);

    const response = await fetch(geocodeUrl.toString(), { cache: 'no-store' });
    const data = await response.json();

    const first = data?.results?.[0];
    return NextResponse.json({ label: first?.formatted_address || 'Current location' });
  } catch (_error) {
    return NextResponse.json({ label: 'Current location' });
  }
}
