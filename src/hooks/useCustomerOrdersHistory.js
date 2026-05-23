'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

export function useCustomerOrdersHistory(limit = 40) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setRows([]);
        return;
      }
      const { data, error: qErr } = await supabase
        .from('orders')
        .select(
          `id, reservation_code, total, created_at, order_status, payment_status,
           bag:rescue_bags(title), outlet:outlets(name)`,
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (qErr) throw qErr;
      setRows(
        (data ?? []).map((r) => ({
          id: String(r.id),
          reservation_code: String(r.reservation_code ?? ''),
          total: Number(r.total ?? 0),
          created_at: r.created_at,
          order_status: String(r.order_status ?? ''),
          payment_status: String(r.payment_status ?? ''),
          bag_title: r.bag?.title ?? 'Rescue bag',
          outlet_name: r.outlet?.name ?? '',
        })),
      );
    } catch (e) {
      setError(mapSupabaseError(e, 'Could not load payment history.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [limit, supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refetch();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refetch]);

  return { rows, loading, error, refetch };
}
