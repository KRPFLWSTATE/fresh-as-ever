'use client';

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Geolocation on web uses the browser API; on Capacitor native uses @capacitor/geolocation.
 * @param {{ enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number }} [options]
 * @returns {Promise<GeolocationPosition>}
 */
export async function getCurrentPositionNativeOrWeb(options = {}) {
  const enableHighAccuracy = options.enableHighAccuracy ?? true;
  const timeout = options.timeout ?? 22000;
  const maximumAge = options.maximumAge ?? 0;

  if (Capacitor.isNativePlatform()) {
    const perm = await Geolocation.requestPermissions();
    if (perm.location === 'denied') {
      const err = new Error('User denied Geolocation');
      err.code = 1;
      throw err;
    }

    const result = await Geolocation.getCurrentPosition({
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    return {
      coords: {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy ?? 0,
        altitude: result.coords.altitude ?? null,
        altitudeAccuracy: result.coords.altitudeAccuracy ?? null,
        heading: result.coords.heading ?? null,
        speed: result.coords.speed ?? null,
      },
      timestamp: result.timestamp ?? Date.now(),
    };
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    const err = new Error('Geolocation not supported');
    err.code = 2;
    throw err;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  });
}

export function isGeolocationAvailable() {
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
    return true;
  }
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}
