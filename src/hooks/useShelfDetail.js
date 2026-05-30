'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

export function useShelfDetail(shelfId) {
  const supabase = useMemo(() => createClient(), []);
  const [shelf, setShelf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShelf = useCallback(async () => {
    if (!shelfId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: qErr } = await supabase
        .from('clearance_shelves')
        .select(`
          *,
          outlet:outlets (
            id, name, address, category, is_halal_certified,
            merchant:merchants (business_name)
          ),
          items:clearance_shelf_items (
            *
          )
        `)
        .eq('id', shelfId)
        .eq('status', 'published')
        .maybeSingle();
      if (qErr) throw qErr;
      if (!data) throw new Error('shelf_not_found');
      const items = (data.items ?? [])
        .filter((i) => i.status === 'live' || i.status === 'sold_out')
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setShelf({ ...data, items });
    } catch (err) {
      setError(mapSupabaseError(err));
      setShelf(null);
    } finally {
      setLoading(false);
    }
  }, [shelfId, supabase]);

  useEffect(() => {
    void fetchShelf();
  }, [fetchShelf]);

  useEffect(() => {
    if (!shelfId) return undefined;
    const channel = supabase
      .channel(`shelf-items-${shelfId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clearance_shelf_items', filter: `shelf_id=eq.${shelfId}` },
        () => {
          void fetchShelf();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchShelf, shelfId, supabase]);

  return { shelf, loading, error, refresh: fetchShelf };
}
