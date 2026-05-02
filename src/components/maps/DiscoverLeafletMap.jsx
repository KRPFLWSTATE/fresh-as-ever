'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Popup,
  ZoomControl,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import { fixLeafletDefaultIcons } from '@/lib/leaflet/fixDefaultIcons';
import { CARTO_VOYAGER_URL, CARTO_VOYAGER_ATTRIBUTION } from '@/lib/leaflet/cartoTiles';

fixLeafletDefaultIcons();

function coordKey(lat, lng) {
  return `${lat.toFixed(5)}_${lng.toFixed(5)}`;
}

function buildOutletPins(bags) {
  if (!Array.isArray(bags)) return [];
  const byCoord = new Map();
  for (const bag of bags) {
    const lat = typeof bag?.outlet_lat === 'number' ? bag.outlet_lat : parseFloat(bag?.outlet_lat);
    const lng = typeof bag?.outlet_lng === 'number' ? bag.outlet_lng : parseFloat(bag?.outlet_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const k = coordKey(lat, lng);
    let pin = byCoord.get(k);
    if (!pin) {
      pin = {
        key: k,
        lat,
        lng,
        label: bag.outlet_name || 'Pickup',
        firstBagId: bag.id,
        count: 0,
      };
      byCoord.set(k, pin);
    }
    pin.count += 1;
  }
  return [...byCoord.values()];
}

/**
 * Fits map to user location + pickup pins when pins exist (see visible bags below).
 */
function DiscoverFitBounds({ userCenter, baseZoom, pinsKey }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const [ulat, ulng] = userCenter;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;

      map.invalidateSize();

      const userLL = L.latLng(ulat, ulng);
      const coords = pinsKey
        ? pinsKey.split('|').filter(Boolean).map((segment) => {
            const [la, ln] = segment.split(',');
            return L.latLng(parseFloat(la, 10), parseFloat(ln, 10));
          })
        : [];

      const validPins = coords.filter(
        (ll) => Number.isFinite(ll.lat) && Number.isFinite(ll.lng)
      );

      if (validPins.length === 0) {
        map.setView(userLL, baseZoom, { animate: false });
        return;
      }

      let bounds = L.latLngBounds([userLL, ...validPins]);
      if (!bounds.isValid()) {
        bounds = L.latLngBounds(userLL, userLL);
      }

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
        animate: false,
      });
    };

    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [map, userCenter, baseZoom, pinsKey]);

  return null;
}

/**
 * Leaflet/OSM-compatible 2D map: Voyager raster tiles + pickup pins + "you" halo.
 *
 * NOTE: True 3D tilt/terrain/buildings requires a WebGL stack (e.g. MapLibre GL with
 * pitched camera + DEM/vector terrain), not leaflet raster tiles alone.
 */
export default function DiscoverLeafletMap({
  center,
  zoom = 13,
  bags = [],
  className = '',
}) {
  const lat = center?.lat;
  const lng = center?.lng;
  const ok =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const outletPins = useMemo(() => buildOutletPins(bags), [bags]);

  const pinsBoundsKey = useMemo(() => {
    if (outletPins.length === 0) return '';
    return outletPins.map((p) => `${p.lat},${p.lng}`).join('|');
  }, [outletPins]);

  const mapKey = useMemo(
    () => `${lat}-${lng}-${zoom}-${outletPins.length}`,
    [lat, lng, zoom, outletPins.length]
  );

  const userCenter = useMemo(() => [lat, lng], [lat, lng]);

  if (!ok) return null;

  return (
    <div className="space-y-2">
      <div
        className={`fea-map-shell relative min-h-[240px] h-56 w-full overflow-hidden rounded-2xl border border-divider ring-2 ring-primary/15 md:h-72 ${className}`.trim()}
      >
        <MapContainer
          key={mapKey}
          center={userCenter}
          zoom={zoom}
          zoomControl={false}
          className="fea-leaflet fea-leaflet--voyager isolate z-0 h-full min-h-[inherit] w-full !bg-[#dfe6ed]"
          scrollWheelZoom
        >
          <TileLayer
            attribution={CARTO_VOYAGER_ATTRIBUTION}
            url={CARTO_VOYAGER_URL}
            subdomains="abcd"
            maxZoom={20}
            detectRetina
          />
          <DiscoverFitBounds
            userCenter={userCenter}
            baseZoom={zoom}
            pinsKey={pinsBoundsKey}
          />
          <ZoomControl position="topright" />

          {outletPins.map((pin) => (
            <CircleMarker
              key={pin.key}
              center={[pin.lat, pin.lng]}
              radius={10}
              pathOptions={{
                color: '#01696f',
                weight: 2,
                fillColor: '#da7101',
                fillOpacity: 0.95,
                className: 'fea-outlet-marker',
              }}
            >
              <Popup>
                <span className="font-label-caps mb-1 block text-text-faint">
                  Rescue pickup
                </span>
                <strong className="font-body-md font-semibold text-text">{pin.label}</strong>
                {pin.count > 1 ? (
                  <span className="mt-1 block font-body-sm text-text-muted">
                    {pin.count} listings here
                  </span>
                ) : null}
                <Link
                  href={`/bags/${pin.firstBagId}`}
                  className="mt-2 inline-block rounded-lg bg-primary px-3 py-1.5 font-label text-xs font-bold text-white hover:bg-primary-hover"
                >
                  View bag
                </Link>
              </Popup>
            </CircleMarker>
          ))}

          <CircleMarker
            center={userCenter}
            radius={12}
            pathOptions={{
              color: '#01696f',
              weight: 3,
              fillColor: '#ffffff',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <span className="font-label text-xs font-semibold uppercase tracking-wide text-text-faint">
                You
              </span>
              <span className="mt-0.5 block font-body-sm font-semibold text-text">
                Approximate location for search
              </span>
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-text-muted">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full border-[3px] border-primary bg-background shadow-sm ring-2 ring-background"
            aria-hidden
          />
          Your area
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full border-2 border-primary bg-accent shadow-sm"
            aria-hidden
          />
          Pickup (listed bags below)
        </span>
      </div>
      {outletPins.length === 0 && bags.length > 0 ? (
        <p className="rounded-lg border border-divider bg-primary-highlight/40 px-3 py-2 font-body-sm text-text-muted">
          No orange pickup dots yet — those appear when each outlet has a{' '}
          <strong className="font-semibold text-text">saved map location</strong> in merchant settings.
          Listings below may still show without pins.
        </p>
      ) : null}
    </div>
  );
}
