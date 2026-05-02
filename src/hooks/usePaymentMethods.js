'use client';

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

const META_KEY = 'saved_payment_methods';

function normalizeList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object' && x.id);
}

/**
 * Persist test/display payment methods on the auth user record (no full card numbers).
 */
export function usePaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const list = normalizeList(user?.user_metadata?.[META_KEY]);
      setMethods(list);
    } catch (e) {
      setError(e?.message || 'Could not load payment methods.');
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    startTransition(() => {
      reload();
    });
  }, [reload]);

  const persist = useCallback(
    async (next) => {
      const safe = normalizeList(next);
      const { error: upErr } = await supabase.auth.updateUser({
        data: { [META_KEY]: safe },
      });
      if (upErr) throw upErr;
      setMethods(safe);
    },
    [supabase]
  );

  const addMethod = useCallback(
    async ({ brand, last4, expiry, label }) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `pm-${Date.now()}`;
      const trimmedBrand = String(brand || 'Card').trim() || 'Card';
      const trimmedLast = String(last4 || '').replace(/\D/g, '').slice(-4) || '0000';
      const trimmedExpiry = String(expiry || '').trim() || '—';
      const trimmedLabel = String(label || `${trimmedBrand} •••• ${trimmedLast}`).trim();
      const hadAny = methods.length > 0;
      const entry = {
        id,
        brand: trimmedBrand,
        last4: trimmedLast,
        expiry: trimmedExpiry,
        label: trimmedLabel,
        isDefault: !hadAny,
      };
      const next = hadAny ? methods.map((m) => ({ ...m, isDefault: false })) : [];
      await persist([...next, entry]);
    },
    [methods, persist]
  );

  const setDefault = useCallback(
    async (id) => {
      const next = methods.map((m) => ({ ...m, isDefault: m.id === id }));
      await persist(next);
    },
    [methods, persist]
  );

  const removeMethod = useCallback(
    async (id) => {
      const filtered = methods.filter((m) => m.id !== id);
      let next = filtered;
      if (filtered.length > 0 && !filtered.some((m) => m.isDefault)) {
        next = filtered.map((m, i) => ({ ...m, isDefault: i === 0 }));
      }
      await persist(next);
    },
    [methods, persist]
  );

  return {
    methods,
    loading,
    error,
    reload,
    addMethod,
    setDefault,
    removeMethod,
  };
}
