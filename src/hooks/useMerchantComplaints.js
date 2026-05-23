'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import { mapSupabaseError } from '@/lib/supabaseError';

function mapRow(raw) {
  const order = raw.order;
  const reporter = raw.reporter;
  const code = String(order?.reservation_code ?? '').trim();
  return {
    id: String(raw.id),
    type: String(raw.type ?? 'Complaint'),
    description: String(raw.description ?? '').trim() || '—',
    status: String(raw.status ?? 'open'),
    createdAtLabel: raw.created_at
      ? new Date(raw.created_at).toLocaleString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—',
    orderLabel: code ? `Order #${code}` : `Order ${String(raw.id).slice(0, 8)}`,
    reporterName: String(reporter?.full_name ?? '').trim() || 'Customer',
    orderId: order?.id ? String(order.id) : null,
  };
}

export function useMerchantComplaints() {
  const supabase = useMemo(() => createClient(), []);
  const { activeOutlet, outlets, loading: merchantLoading } = useMerchantContext();
  const outletScopeIds = useMemo(
    () => (outlets ?? []).map((o) => String(o.id)).filter(Boolean),
    [outlets],
  );
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (merchantLoading) return;
    if (outletScopeIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const scope = new Set(outletScopeIds);
      const { data, error: qErr } = await supabase
        .from('complaints')
        .select(
          `
          id,
          type,
          description,
          status,
          created_at,
          order_id,
          reporter:profiles!complaints_reporter_id_fkey(full_name),
          order:orders(id, reservation_code, outlet_id)
        `,
        )
        .order('created_at', { ascending: false })
        .limit(100);
      if (qErr) throw qErr;
      const filtered = (data ?? []).filter((raw) => {
        const oid = raw.order?.outlet_id != null ? String(raw.order.outlet_id) : '';
        return oid && scope.has(oid);
      });
      setRows(filtered.map(mapRow));
    } catch (e) {
      setError(mapSupabaseError(e, 'Could not load disputes.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [merchantLoading, outletScopeIds, supabase]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refetch();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refetch, activeOutlet?.id]);

  return { rows, loading, error, refetch, outletScopeIds };
}
