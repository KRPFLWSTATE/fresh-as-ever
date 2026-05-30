'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import {
  formatLkr,
  isCollectedOrder,
  sumSurplusRecovered,
} from '@/lib/merchantAnalytics';
import { mapSupabaseError } from '@/lib/supabaseError';

function monthBounds(offsetMonths) {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth() + offsetMonths,
    1,
  ).getTime();
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + offsetMonths + 1,
    1,
  ).getTime();
  return { start, end };
}

export function useMerchantRecoveredRevenue() {
  const { activeOutlet, merchantId, outletScopeIds } = useMerchantContext();
  const supabase = useMemo(() => createClient(), []);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastMonth, setLastMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const thisBounds = useMemo(() => monthBounds(0), []);
  const lastBounds = useMemo(() => monthBounds(-1), []);

  const monthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, []);

  const fetchMetrics = useCallback(async () => {
    const scopeIds = activeOutlet?.id
      ? [activeOutlet.id]
      : outletScopeIds?.length
        ? outletScopeIds
        : [];
    if (!scopeIds.length && !merchantId) {
      setThisMonth(0);
      setLastMonth(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const earliest = new Date(lastBounds.start).toISOString();
      let query = supabase
        .from('orders')
        .select(
          `
          id,
          quantity,
          created_at,
          order_status,
          outlet_id,
          bag:rescue_bags(retail_value_estimate)
        `,
        )
        .gte('created_at', earliest)
        .limit(8000);

      if (activeOutlet?.id) {
        query = query.eq('outlet_id', activeOutlet.id);
      } else if (scopeIds.length) {
        query = query.in('outlet_id', scopeIds);
      }

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;

      const rows = (data ?? []).filter((r) =>
        isCollectedOrder(r.order_status),
      );

      const thisRows = rows.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= thisBounds.start && t < thisBounds.end;
      });
      const lastRows = rows.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= lastBounds.start && t < lastBounds.end;
      });

      setThisMonth(sumSurplusRecovered(thisRows));
      setLastMonth(sumSurplusRecovered(lastRows));
    } catch (e) {
      setError(mapSupabaseError(e, 'Could not load recovered revenue.'));
      setThisMonth(0);
      setLastMonth(0);
    } finally {
      setLoading(false);
    }
  }, [
    supabase,
    activeOutlet?.id,
    merchantId,
    outletScopeIds,
    thisBounds.start,
    thisBounds.end,
    lastBounds.start,
    lastBounds.end,
  ]);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  const trendPercent =
    lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : thisMonth > 0
        ? 100
        : null;

  return {
    thisMonth,
    lastMonth,
    thisMonthLabel: monthLabel,
    trendPercent,
    thisMonthLabelFormatted: formatLkr(thisMonth),
    loading,
    error,
    refetch: fetchMetrics,
  };
}
