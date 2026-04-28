'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function GoogleMap({ locationString }) {
  const mapRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Expected incoming format from postgis ST_AsText: "POINT(lng lat)"
    // Or we might just have a hardcoded JSON if the location isn't perfectly extracted.
    // Assuming backend returns standard [lng, lat] array or we parse POINT()
    let lat = 6.9271; // Default Colombo
    let lng = 79.8612;

    if (locationString) {
      if (typeof locationString === 'string' && locationString.startsWith('POINT(')) {
        const coords = locationString.slice(6, -1).split(' ');
        lng = parseFloat(coords[0]);
        lat = parseFloat(coords[1]);
      } else if (locationString.coordinates) {
        // PostGIS json format: { type: 'Point', coordinates: [lng, lat] }
        lng = locationString.coordinates[0];
        lat = locationString.coordinates[1];
      }
    }

    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        setError(true);
        return;
      }

      const loader = new Loader({
        apiKey,
        version: "weekly",
      });

      try {
        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        const position = { lat, lng };

        const map = new Map(mapRef.current, {
          center: position,
          zoom: 15,
          mapId: 'FRESH_AS_EVER_MAP_ID', // Reqd for advanced markers
          disableDefaultUI: true,
          zoomControl: true,
        });

        new AdvancedMarkerElement({
          map,
          position,
          title: "Pickup Location",
        });
      } catch (e) {
        console.error("Map load error:", e);
        setError(true);
      }
    };

    initMap();
  }, [locationString]);

  if (error) {
    return (
      <div style={{ height: '200px', width: '100%', borderRadius: '12px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6b7280' }}>
        <span style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</span>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Pickup Location Map</span>
        <span style={{ fontSize: '12px', marginTop: '4px' }}>(Missing Maps API Key)</span>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
    />
  );
}
