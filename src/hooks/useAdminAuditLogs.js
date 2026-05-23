'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

const PAGE_SIZE = 30;

export function useAdminAuditLogs({ kind = 'all', search = '', page = 1 } = {}) {
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
        .from('audit_logs')
        .select(
          'id, occurred_at, kind, action, title, detail, actor_role, metadata',
          { count: 'exact' },
        )
        .order('occurred_at', { ascending: false })
        .range(from, to);
      if (kind !== 'all') req = req.eq('kind', kind);
      const trimmed = search.trim();
      if (trimmed) {
        const escaped = trimmed.replace(/[%,]/g, '');
        req = req.or(
          `title.ilike.%${escaped}%,detail.ilike.%${escaped}%,action.ilike.%${escaped}%`,
        );
      }
      const { data, error: e, count } = await req;
      if (e) throw e;
      setRows(
        (data ?? []).map((r) => ({
          id: String(r.id),
          occurred_at: r.occurred_at,
          kind: String(r.kind ?? ''),
          action: String(r.action ?? ''),
          title: String(r.title ?? ''),
          detail: String(r.detail ?? ''),
          actor_role: String(r.actor_role ?? ''),
        })),
      );
      if (typeof count === 'number') setTotalCount(count);
    } catch (err) {
      setError(mapSupabaseError(err, 'Could not load audit logs.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [kind, page, search]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  return { rows, totalCount, pageSize: PAGE_SIZE, loading, error, refetch: load };
}
