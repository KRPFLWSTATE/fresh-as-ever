'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

export function useMerchantShelves(outletId) {
  const supabase = useMemo(() => createClient(), []);
  const [shelves, setShelves] = useState([]);
  const [todayShelf, setTodayShelf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShelves = useCallback(async () => {
    if (!outletId) {
      setShelves([]);
      setTodayShelf(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error: qErr } = await supabase
        .from('clearance_shelves')
        .select(`
          *,
          items:clearance_shelf_items (*)
        `)
        .eq('outlet_id', outletId)
        .order('shelf_date', { ascending: false })
        .limit(30);
      if (qErr) throw qErr;
      const rows = data ?? [];
      setShelves(rows);
      setTodayShelf(rows.find((r) => r.shelf_date === today) ?? null);
    } catch (err) {
      setError(mapSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [outletId, supabase]);

  useEffect(() => {
    void fetchShelves();
  }, [fetchShelves]);

  const upsertShelf = useCallback(
    async ({ pickupStart, pickupEnd, notes, status, items }) => {
      if (!outletId) throw new Error('No outlet selected');
      const today = new Date().toISOString().slice(0, 10);
      let shelfId = todayShelf?.id;
      if (!shelfId) {
        const { data: inserted, error: insErr } = await supabase
          .from('clearance_shelves')
          .insert({
            outlet_id: outletId,
            shelf_date: today,
            status: status ?? 'draft',
            pickup_start: pickupStart,
            pickup_end: pickupEnd,
            notes: notes ?? null,
            published_at: status === 'published' ? new Date().toISOString() : null,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        shelfId = inserted.id;
      } else {
        const { error: updErr } = await supabase
          .from('clearance_shelves')
          .update({
            pickup_start: pickupStart,
            pickup_end: pickupEnd,
            notes: notes ?? null,
            status: status ?? todayShelf.status,
            published_at:
              status === 'published' && todayShelf.status !== 'published'
                ? new Date().toISOString()
                : todayShelf.published_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shelfId);
        if (updErr) throw updErr;
      }

      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.id) {
            await supabase
              .from('clearance_shelf_items')
              .update({
                name_snapshot: item.name_snapshot,
                brand_snapshot: item.brand_snapshot,
                rescue_price: item.rescue_price,
                retail_price: item.retail_price,
                quantity_total: item.quantity_total,
                quantity_remaining: item.quantity_remaining,
                allergens_snapshot: item.allergens_snapshot ?? [],
                is_halal: item.is_halal,
                image_url_snapshot: item.image_url_snapshot,
                status: item.status ?? 'live',
                sort_order: item.sort_order ?? 0,
              })
              .eq('id', item.id);
          } else {
            await supabase.from('clearance_shelf_items').insert({
              shelf_id: shelfId,
              product_id: item.product_id ?? null,
              barcode: item.barcode ?? null,
              name_snapshot: item.name_snapshot,
              brand_snapshot: item.brand_snapshot,
              rescue_price: item.rescue_price,
              retail_price: item.retail_price,
              quantity_total: item.quantity_total,
              quantity_remaining: item.quantity_remaining ?? item.quantity_total,
              allergens_snapshot: item.allergens_snapshot ?? [],
              is_halal: item.is_halal,
              image_url_snapshot: item.image_url_snapshot,
            });
          }
        }
      }

      await fetchShelves();
      return shelfId;
    },
    [fetchShelves, outletId, supabase, todayShelf],
  );

  const cloneYesterday = useCallback(
    async (sourceShelfId) => {
      const { data, error: rpcErr } = await supabase.rpc('clone_shelf_to_today', {
        p_source_shelf_id: sourceShelfId,
      });
      if (rpcErr) throw rpcErr;
      await fetchShelves();
      return data;
    },
    [fetchShelves, supabase],
  );

  return {
    shelves,
    todayShelf,
    loading,
    error,
    refresh: fetchShelves,
    upsertShelf,
    cloneYesterday,
  };
}
