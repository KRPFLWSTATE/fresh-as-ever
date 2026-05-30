'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';
import { ERROR } from '@/lib/messages/errors.js';
import { mapSupabaseError } from '@/lib/supabaseError';

const PENDING_STATUSES = new Set(['pending', 'processing']);
const SETTLED_STATUSES = new Set(['paid', 'completed']);

function formatLkr(n) {
  return `Rs. ${Math.round(n).toLocaleString('en-LK')}`;
}

export function useMerchantFinance() {
  const [summary, setSummary] = useState({
    pending: 'Rs. 0',
    paidOut: 'Rs. 0',
    lifetime: 'Rs. 0',
    trendPercent: null,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);
  const { activeOutlet, merchant, loading: contextLoading } = useMerchantContext();

  const fetchFinanceData = useCallback(async () => {
    const outletId = activeOutlet?.id != null ? String(activeOutlet.id) : '';
    const merchantId = merchant?.id != null ? String(merchant.id) : '';
    if (!outletId && !merchantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [ordersRes, settlementsRes] = await Promise.all([
        outletId
          ? supabase
              .from('orders')
              .select('total, payment_status, order_status, created_at')
              .eq('outlet_id', outletId)
          : Promise.resolve({ data: [], error: null }),
        merchantId
          ? supabase
              .from('settlements')
              .select('id, status, net_payout, gross_amount, commission_amount, period_end, created_at')
              .eq('merchant_id', merchantId)
              .order('period_end', { ascending: false, nullsFirst: false })
              .limit(80)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (settlementsRes.error) throw settlementsRes.error;

      const validOrders = (ordersRes.data ?? []).filter(
        (o) => o.payment_status === 'paid' || o.order_status === 'collected',
      );
      const lifetimeSum = validOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

      const now = new Date();
      const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      let thisMonthSum = 0;
      let lastMonthSum = 0;
      for (const o of validOrders) {
        const ts = typeof o.created_at === 'string' ? Date.parse(o.created_at) : NaN;
        if (!Number.isFinite(ts)) continue;
        const total = Number(o.total ?? 0);
        if (ts >= thisStart) thisMonthSum += total;
        else if (ts >= lastStart) lastMonthSum += total;
      }
      let trendPercent = null;
      if (lastMonthSum > 0) {
        trendPercent = Math.round(((thisMonthSum - lastMonthSum) / lastMonthSum) * 100);
      } else if (thisMonthSum > 0) {
        trendPercent = 100;
      }

      const settlementRows = (settlementsRes.data ?? []).map((r) => ({
        id: String(r.id ?? ''),
        status: String(r.status ?? '').toLowerCase(),
        net_payout: Number(r.net_payout ?? 0),
        period_end: r.period_end,
        created_at: r.created_at,
      }));

      const pendingSum = settlementRows
        .filter((r) => PENDING_STATUSES.has(r.status))
        .reduce((s, r) => s + r.net_payout, 0);

      const paidOutSum = settlementRows
        .filter((r) => SETTLED_STATUSES.has(r.status))
        .reduce((s, r) => s + r.net_payout, 0);

      setSummary({
        pending: formatLkr(pendingSum),
        paidOut: formatLkr(paidOutSum),
        lifetime: formatLkr(lifetimeSum),
        trendPercent,
      });

      setHistory(
        settlementRows.slice(0, 12).map((r) => ({
          id: r.id,
          date: r.period_end
            ? new Date(r.period_end).toLocaleDateString()
            : r.created_at
              ? new Date(r.created_at).toLocaleDateString()
              : '—',
          amount: formatLkr(r.net_payout),
          status: r.status,
        })),
      );
    } catch (err) {
      setError(mapSupabaseError(err, ERROR.merchant.finance));
    } finally {
      setLoading(false);
    }
  }, [activeOutlet, merchant, supabase]);

  useEffect(() => {
    if (contextLoading) return undefined;
    const t = window.setTimeout(() => {
      void fetchFinanceData();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchFinanceData, contextLoading]);

  const requestPayout = async () => {
    // Payout requests handled by support until payout_requests table ships
  };

  return {
    summary,
    history,
    loading: loading || contextLoading,
    error,
    requestPayout,
    refetch: fetchFinanceData,
  };
}
