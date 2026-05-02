'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { fixLeafletDefaultIcons } from '@/lib/leaflet/fixDefaultIcons';
import { truncate } from '@/lib/utils';
import { CARTO_VOYAGER_URL, CARTO_VOYAGER_ATTRIBUTION } from '@/lib/leaflet/cartoTiles';

fixLeafletDefaultIcons();

/** Single-outlet picker map for bag detail. Dynamically imported with ssr:false. */
export default function OutletLeafletMap({
  lat,
  lng,
  outletName,
  address,
  heightClass = 'min-h-[200px] h-56 md:h-64',
  className = '',
}) {
  const ok =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  if (!ok) {
    return (
      <div
        className={`flex w-full ${heightClass} items-center justify-center rounded-2xl border border-divider bg-surface-2 px-4 text-center font-body-sm text-text-muted ${className}`.trim()}
      >
        Location coordinates unavailable — use Get Directions above.
      </div>
    );
  }

  const title = truncate(String(outletName || 'Pickup'), 48);
  const addr = truncate(String(address || ''), 120);

  return (
    <div
      className={`fea-map-shell ${heightClass} w-full overflow-hidden rounded-2xl border border-divider ${className}`.trim()}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        zoomControl={false}
        className="fea-leaflet fea-leaflet--voyager isolate z-0 h-full w-full !bg-[#dfe6ed]"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution={CARTO_VOYAGER_ATTRIBUTION}
          url={CARTO_VOYAGER_URL}
          subdomains="abcd"
          maxZoom={20}
          detectRetina
        />
        <ZoomControl position="topright" />
        <Marker position={[lat, lng]}>
          <Popup>
            <span className="font-label-caps mb-1 block text-text-faint">Pickup</span>
            <strong className="block font-body-md font-semibold text-text">{title}</strong>
            {addr ? (
              <span className="mt-1 block font-body-sm text-text-muted">{addr}</span>
            ) : null}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
