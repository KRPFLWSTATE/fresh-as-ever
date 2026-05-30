'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const LOOKUP_DEBOUNCE_MS = 300;
const SCAN_THROTTLE_MS = 1500;

export function useBarcodeLookup() {
  const supabaseRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const lastScanRef = useRef({ barcode: '', at: 0 });

  const getClient = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  const lookup = useCallback(
    async (barcode) => {
      const code = String(barcode ?? '').trim();
      if (!code) return null;

      const now = Date.now();
      if (
        lastScanRef.current.barcode === code &&
        now - lastScanRef.current.at < SCAN_THROTTLE_MS
      ) {
        return product;
      }
      lastScanRef.current = { barcode: code, at: now };

      setLoading(true);
      setError(null);
      try {
        const supabase = getClient();
        const { data, error: fnErr } = await supabase.functions.invoke('lookup-product-barcode', {
          body: { barcode: code },
        });
        if (fnErr) throw fnErr;
        if (data?.error) {
          const err = new Error(data.error);
          setError(data.error);
          setProduct(null);
          return null;
        }
        setProduct(data?.product ?? null);
        return data?.product ?? null;
      } catch (err) {
        const msg = String(err?.message ?? err);
        setError(msg);
        setProduct(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getClient, product],
  );

  const submitManual = useCallback(
    async (payload) => {
      const supabase = getClient();
      const { data, error: rpcErr } = await supabase.rpc('submit_product_to_catalog', {
        p_barcode: payload.barcode,
        p_name: payload.name,
        p_brand: payload.brand ?? null,
        p_category: payload.category ?? null,
        p_allergens: payload.allergens ?? [],
        p_is_halal_hint: payload.is_halal_hint ?? null,
        p_image_url: payload.image_url ?? null,
      });
      if (rpcErr) throw rpcErr;
      setProduct(data);
      return data;
    },
    [getClient],
  );

  return { loading, error, product, lookup, submitManual, clear: () => setProduct(null) };
}
