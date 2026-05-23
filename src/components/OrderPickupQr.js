'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function OrderPickupQr({ code, size = 192 }) {
  const [dataUrl, setDataUrl] = useState(null);
  const payload = String(code ?? '').trim().toUpperCase();

  useEffect(() => {
    if (!payload) return undefined;
    let cancelled = false;
    const t = window.setTimeout(() => {
      QRCode.toDataURL(payload, { width: size, margin: 2 })
        .then((url) => {
          if (!cancelled) setDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setDataUrl(null);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [payload, size]);

  if (!payload) return null;

  return (
    <div className="flex flex-col items-center gap-md">
      <p className="font-display text-3xl font-black tracking-widest text-primary">
        {payload}
      </p>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`Pickup QR for ${payload}`}
          width={size}
          height={size}
          className="rounded-xl border border-divider bg-white p-2"
        />
      ) : (
        <div
          className="rounded-xl border-2 border-dashed border-divider flex items-center justify-center text-text-muted"
          style={{ width: size, height: size }}
        >
          Generating QR…
        </div>
      )}
      <p className="font-body-sm text-text-muted text-center max-w-xs">
        Show the 6-character code or QR at pickup. Merchants can type the code if scanning fails.
      </p>
    </div>
  );
}
