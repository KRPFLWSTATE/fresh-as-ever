'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from '@phosphor-icons/react';
import { getCelebrationCopy } from '@/content/celebrationMoments';
import { createClient } from '@/lib/supabase/client';

const STORAGE_PREFIX = 'fae_celebration_seen_';

export function ReservationSuccessOverlay({ orderId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams?.get('payment') === 'success';
  const copy = useMemo(() => getCelebrationCopy('reservation'), []);

  const [visible, setVisible] = useState(false);
  const [lineItems, setLineItems] = useState([]);

  useEffect(() => {
    if (!orderId) return;
    const sb = createClient();
    void (async () => {
      const { data } = await sb
        .from('orders')
        .select('shelf_id, order_items(name_snapshot, quantity, line_total)')
        .eq('id', orderId)
        .maybeSingle();
      if (data?.shelf_id && data.order_items?.length) {
        setLineItems(data.order_items);
      }
    })();
  }, [orderId]);

  useEffect(() => {
    if (!paymentSuccess || !orderId || typeof window === 'undefined') return;
    const key = `${STORAGE_PREFIX}${orderId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const t = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(t);
  }, [paymentSuccess, orderId]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    router.replace(url.pathname + (url.search || ''), { scroll: false });
  };

  return (
    <div
      className="celebration-overlay fixed inset-0 z-[80] flex items-center justify-center p-page-margin-mobile md:p-page-margin-desktop bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-headline"
    >
      <div className="celebration-card bg-surface rounded-2xl p-xl max-w-md w-full shadow-xl border border-divider text-center space-y-md">
        <div className="celebration-hero mx-auto w-20 h-20 rounded-full bg-primary-highlight flex items-center justify-center text-primary">
          <CheckCircle weight="fill" className="w-12 h-12 animate-celebration-fade-up" aria-hidden />
        </div>
        <h2 id="celebration-headline" className="font-h1 text-h1 text-text animate-celebration-fade-up">
          {copy.headline}
        </h2>
        <p
          className="font-body-md text-body-md text-text-muted animate-celebration-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          {copy.subcopy}
        </p>
        {lineItems.length > 0 ? (
          <ul
            className="text-left text-sm space-y-1 border border-divider rounded-lg p-3 animate-celebration-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            {lineItems.map((line, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {line.name_snapshot} × {line.quantity}
                </span>
                <span>LKR {Number(line.line_total ?? 0).toLocaleString('en-LK')}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div
          className="flex flex-col gap-sm pt-sm animate-celebration-fade-up"
          style={{ animationDelay: '240ms' }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="w-full h-12 bg-primary text-white font-label rounded-xl active:scale-[0.98] transition-transform"
          >
            {copy.primaryCta}
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              router.push('/discover');
            }}
            className="w-full h-12 border border-divider text-primary font-label rounded-xl active:scale-[0.98] transition-transform"
          >
            {copy.secondaryCta}
          </button>
        </div>
      </div>
    </div>
  );
}
