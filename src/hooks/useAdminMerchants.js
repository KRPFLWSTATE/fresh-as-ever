'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

const PAGE_SIZE = 20;

export function useAdminMerchants({ statusFilter = 'all', query = '', page = 1 } = {}) {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sb = createClient();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    try {
      let req = sb
        .from('merchants')
        .select(
          'id, business_name, status, created_at, contact_email, contact_phone',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(from, to);
      if (statusFilter !== 'all') req = req.eq('status', statusFilter);
      const trimmed = query.trim();
      if (trimmed) {
        const escaped = trimmed.replace(/[%,]/g, '');
        req = req.or(
          `business_name.ilike.%${escaped}%,contact_email.ilike.%${escaped}%,contact_phone.ilike.%${escaped}%`,
        );
      }
      const { data, error: e, count } = await req;
      if (e) throw e;
      setRows(
        (data ?? []).map((r) => ({
          id: String(r.id),
          business_name: String(r.business_name ?? '') || 'Merchant',
          status: String(r.status ?? 'pending'),
          created_at: r.created_at,
          contact_email: String(r.contact_email ?? ''),
          contact_phone: String(r.contact_phone ?? ''),
        })),
      );
      if (typeof count === 'number') setTotalCount(count);
    } catch (err) {
      setError(mapSupabaseError(err, 'Could not load merchants.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  return { rows, totalCount, pageSize: PAGE_SIZE, loading, error, refetch: load };
}
