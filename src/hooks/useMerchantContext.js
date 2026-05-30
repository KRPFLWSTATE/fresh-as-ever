'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureOutletDemoListings } from '@/lib/ensureOutletDemoListings';
import { mapSupabaseError } from '@/lib/supabaseError';

const initialState = {
  merchant: null,
  outlets: [],
  activeOutletId: null,
  loading: true,
  error: null,
  initialized: false,
};

const merchantContextStore = {
  state: initialState,
  listeners: new Set(),
  fetchPromise: null,
};

function emitStore() {
  merchantContextStore.listeners.forEach((listener) => listener());
}

function updateStore(updater) {
  merchantContextStore.state = updater(merchantContextStore.state);
  emitStore();
}

async function fetchMerchantContext(supabase) {
  if (merchantContextStore.fetchPromise) {
    return merchantContextStore.fetchPromise;
  }

  merchantContextStore.fetchPromise = (async () => {
    await Promise.resolve();
    updateStore((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        updateStore(() => ({
          ...initialState,
          loading: false,
          error: 'Not authenticated',
          initialized: true,
        }));
        return;
      }

      await supabase.rpc('link_merchant_staff_from_email');

      const { data: merchantRows, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (merchantError) throw merchantError;

      let merchantData = merchantRows?.[0] || null;

      if (!merchantData?.id) {
        const { data: staffLink, error: staffErr } = await supabase
          .from('merchant_staff')
          .select('merchant_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!staffErr && staffLink?.merchant_id) {
          const { data: staffMerchant, error: smErr } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', String(staffLink.merchant_id))
            .maybeSingle();
          if (!smErr && staffMerchant) {
            merchantData = staffMerchant;
          }
        }
      }

      if (!merchantData?.id) {
        updateStore(() => ({
          ...initialState,
          loading: false,
          initialized: true,
        }));
        return;
      }

      const { data: outletsData, error: outletsError } = await supabase
        .from('outlets')
        .select('*')
        .eq('merchant_id', merchantData.id);

      if (outletsError) throw outletsError;

      const nextOutlets = outletsData || [];
      const previousId = merchantContextStore.state.activeOutletId;
      const nextActiveOutletId =
        nextOutlets.length > 0
          ? nextOutlets.some((outlet) => String(outlet.id) === String(previousId))
            ? String(previousId)
            : String(nextOutlets[0]?.id || '')
          : null;

      updateStore(() => ({
        merchant: merchantData,
        outlets: nextOutlets,
        activeOutletId: nextActiveOutletId,
        loading: false,
        error: null,
        initialized: true,
      }));
    } catch (err) {
      updateStore(() => ({
        ...initialState,
        loading: false,
        error: mapSupabaseError(err, 'Failed to load merchant details.'),
        initialized: true,
      }));
    } finally {
      merchantContextStore.fetchPromise = null;
    }
  })();

  return merchantContextStore.fetchPromise;
}

export function useMerchantContext() {
  const supabase = useMemo(() => createClient(), []);
  const [, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => {
      setVersion((current) => current + 1);
    };
    merchantContextStore.listeners.add(listener);
    return () => {
      merchantContextStore.listeners.delete(listener);
    };
  }, []);

  const fetchContext = useCallback(async () => fetchMerchantContext(supabase), [supabase]);

  useEffect(() => {
    if (merchantContextStore.state.initialized || merchantContextStore.fetchPromise) {
      return undefined;
    }
    const t = window.setTimeout(() => {
      void fetchContext();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchContext]);

  const setActiveOutletId = useCallback((next) => {
    updateStore((current) => {
      const resolved =
        typeof next === 'function' ? next(current.activeOutletId) : next;
      return {
        ...current,
        activeOutletId:
          resolved != null && String(resolved).length > 0 ? String(resolved) : null,
      };
    });
  }, []);

  const { merchant, outlets, activeOutletId, loading, error } = merchantContextStore.state;

  const activeOutlet = useMemo(
    () =>
      outlets.find((outlet) => String(outlet.id) === String(activeOutletId)) ||
      outlets[0] ||
      null,
    [outlets, activeOutletId],
  );
  const outletScopeIds = useMemo(() => outlets.map((outlet) => outlet.id), [outlets]);

  const updateMerchantSettings = useCallback(
    async ({
      storeName,
      phone,
      email,
      operatingHours,
      address,
      location,
      coverImageUrl,
      category,
    }) => {
      if (!merchant?.id || !activeOutlet?.id) {
        throw new Error('Merchant context is unavailable.');
      }

      const merchantPatch = {};
      if (Object.prototype.hasOwnProperty.call(merchant, 'business_name') && storeName !== undefined) merchantPatch.business_name = storeName;
      if (Object.prototype.hasOwnProperty.call(merchant, 'phone') && phone !== undefined) merchantPatch.phone = phone;
      if (Object.prototype.hasOwnProperty.call(merchant, 'email') && email !== undefined) merchantPatch.email = email;
      if (Object.prototype.hasOwnProperty.call(merchant, 'operating_hours') && operatingHours !== undefined) merchantPatch.operating_hours = operatingHours;

      const outletPatch = {};
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'name') && storeName !== undefined) outletPatch.name = storeName;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'address') && address !== undefined) outletPatch.address = address;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'location') && location !== undefined) outletPatch.location = location;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'cover_image_url') && coverImageUrl !== undefined) outletPatch.cover_image_url = coverImageUrl;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'phone') && phone !== undefined) outletPatch.phone = phone;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'email') && email !== undefined) outletPatch.email = email;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'operating_hours') && operatingHours !== undefined) outletPatch.operating_hours = operatingHours;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'category') && category !== undefined) outletPatch.category = category;

      if (Object.keys(merchantPatch).length > 0) {
        const { error: merchantUpdateError } = await supabase
          .from('merchants')
          .update(merchantPatch)
          .eq('id', merchant.id);
        if (merchantUpdateError) throw merchantUpdateError;
      }

      if (Object.keys(outletPatch).length > 0) {
        const { error: outletUpdateError } = await supabase
          .from('outlets')
          .update(outletPatch)
          .eq('id', activeOutlet.id);
        if (outletUpdateError) throw outletUpdateError;
        if (outletPatch.category !== undefined) {
          await ensureOutletDemoListings(activeOutlet.id);
        }
      }

      await fetchContext();
      return true;
    },
    [merchant, activeOutlet, supabase, fetchContext],
  );

  return {
    merchant,
    outlets,
    activeOutlet,
    activeOutletId: activeOutlet?.id || null,
    outletScopeIds,
    setActiveOutletId,
    updateMerchantSettings,
    loading,
    error,
    refetch: fetchContext,
  };
}
