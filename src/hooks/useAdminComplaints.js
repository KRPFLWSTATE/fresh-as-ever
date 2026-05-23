'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isOpenComplaintStatus } from '@/lib/adminComplaints';
import { mapSupabaseError } from '@/lib/supabaseError';

export function useAdminComplaints({ tab = 'all' } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sb = createClient();
    try {
      const { data, error: e } = await sb
        .from('complaints')
        .select(
          `
          id,
          type,
          description,
          status,
          photos,
          created_at,
          order:orders(reservation_code, outlet:outlets(name, merchant:merchants(business_name))),
          reporter:profiles!complaints_reporter_id_fkey(full_name)
        `,
        )
        .order('created_at', { ascending: false })
        .limit(80);
      if (e) throw e;
      const mapped = (data ?? []).map((r) => {
        const order = r.order;
        const outlet = order?.outlet;
        const merchant = outlet?.merchant;
        return {
          id: String(r.id),
          type: String(r.type ?? 'Complaint'),
          description: String(r.description ?? ''),
          status: String(r.status ?? 'open'),
          photos: Array.isArray(r.photos) ? r.photos : [],
          created_at: r.created_at,
          order_code: String(order?.reservation_code ?? '') || '—',
          merchant_name: String(merchant?.business_name ?? outlet?.name ?? '') || 'Merchant',
          reporter_name: String(r.reporter?.full_name ?? '') || 'Customer',
        };
      });
      const openOnly = mapped.filter((r) => isOpenComplaintStatus(r.status));
      const s = (v) => v.trim().toLowerCase();
      let visible = openOnly;
      if (tab === 'unresolved') {
        visible = openOnly.filter((r) => ['unresolved', 'open'].includes(s(r.status)));
      } else if (tab === 'escalated') {
        visible = openOnly.filter((r) => s(r.status) === 'escalated');
      }
      setRows(visible);
    } catch (err) {
      setError(mapSupabaseError(err, 'Could not load complaints.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const patchComplaint = useCallback(
    async (complaintId, patch) => {
      const sb = createClient();
      const { error: e } = await sb.from('complaints').update(patch).eq('id', complaintId);
      if (e) return { error: mapSupabaseError(e) };
      await load();
      return {};
    },
    [load],
  );

  return { rows, loading, error, refetch: load, patchComplaint };
}
