'use client';

import Script from 'next/script';

const PAYHERE_SDK = 'https://www.payhere.lk/lib/payhere.js';

/**
 * Loads PayHere JS SDK so `window.payhere` exists in WebView and desktop checkout.
 */
export function PayHereScript() {
  return (
    <Script id="payhere-sdk" src={PAYHERE_SDK} strategy="afterInteractive" />
  );
}
