'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';
import {
  aggregateHourBuckets,
  aggregateTopBags,
  countDistinctCustomers,
  cutoffIsoForWindow,
  estimateWasteKg,
  formatLkr,
  isCollectedOrder,
  peakHourLabel,
  retailToKgProxy,
  sumRevenue,
} from '@/lib/merchantAnalytics';
import { mapSupabaseError } from '@/lib/supabaseError';

export function useMerchantAnalytics(windowDays = 30) {
  const supabase = useMemo(() => createClient(), []);
  const { activeOutlet, merchant, loading: ctxLoading } = useMerchantContext();
  const outletId = activeOutlet?.id ?? null;
  const merchantId = merchant?.id ?? null;

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!outletId && !merchantId) {
      setSnapshot({
        revenue: 0,
        revenueLabel: formatLkr(0),
        customerReach: 0,
        wasteKg: 0,
        co2Kg: 0,
        hourBuckets: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
        peakHour: '—',
        topBags: [],
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const cutoff = cutoffIsoForWindow(windowDays);
    try {
      let req = supabase
        .from('orders')
        .select(
          `id, customer_id, bag_id, total, quantity, created_at, order_status,
           bag:rescue_bags(title, retail_value_estimate)`,
        )
        .gte('created_at', cutoff)
        .limit(5000);
      if (outletId) req = req.eq('outlet_id', outletId);
      else if (merchantId) {
        req = req.eq('outlet.merchant_id', merchantId);
      }
      const { data, error: qErr } = await req;
      if (qErr) throw qErr;

      const rows = data ?? [];
      const collected = rows.filter((r) => isCollectedOrder(r.order_status));
      const revenue = sumRevenue(collected);
      const reach = countDistinctCustomers(collected);
      const hourBuckets = aggregateHourBuckets(rows);
      const topBags = aggregateTopBags(collected);

      const weightMap = new Map();
      for (const r of collected) {
        const bagId = r.bag_id != null ? String(r.bag_id) : '';
        if (!bagId || weightMap.has(bagId)) continue;
        weightMap.set(bagId, retailToKgProxy(r.bag?.retail_value_estimate));
      }
      const wasteKg = estimateWasteKg(collected, weightMap);
      const co2Kg = Math.round(wasteKg * 2.5 * 10) / 10;

      setSnapshot({
        revenue,
        revenueLabel: formatLkr(revenue),
        customerReach: reach,
        wasteKg,
        co2Kg,
        hourBuckets,
        peakHour: peakHourLabel(hourBuckets),
        topBags,
      });
    } catch (e) {
      setError(mapSupabaseError(e, 'Could not load analytics.'));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, outletId, merchantId, windowDays]);

  useEffect(() => {
    if (ctxLoading) return undefined;
    const t = window.setTimeout(() => {
      void refetch();
    }, 0);
    return () => window.clearTimeout(t);
  }, [ctxLoading, refetch]);

  return {
    snapshot,
    loading: loading || ctxLoading,
    error,
    refetch,
  };
}
