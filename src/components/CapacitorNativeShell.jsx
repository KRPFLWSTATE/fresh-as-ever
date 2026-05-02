'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * WebView-specific fixes: disable Serwist/service worker on native so updates
 * always come from the remote Next deployment (plan: avoid stale SW shell).
 */
export function CapacitorNativeShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        for (const reg of regs) {
          reg.unregister().catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
