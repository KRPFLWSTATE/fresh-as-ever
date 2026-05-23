'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CLOSED_COMPLAINT_STATUSES } from '@/lib/adminComplaints';

export const ADMIN_DASHBOARD_TREND_DAYS = 7;
export const ADMIN_DASHBOARD_TREND_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketIndexForDate(trendStart, when, dayCount) {
  const startMs = startOfLocalDay(trendStart).getTime();
  const whenMs = startOfLocalDay(when).getTime();
  return Math.floor((whenMs - startMs) / (24 * 3600 * 1000));
}

const SETTLED_ORDER_STATUSES = new Set(['collected', 'completed']);

export function useAdminDashboardMetrics() {
  const [ordersCount, setOrdersCount] = useState(null);
  const [profilesCount, setProfilesCount] = useState(null);
  const [todaysOrders, setTodaysOrders] = useState(null);
  const [openComplaints, setOpenComplaints] = useState(null);
  const [pendingMerchants, setPendingMerchants] = useState(null);
  const [pendingSettlements, setPendingSettlements] = useState(null);
  const [newMerchantsWeek, setNewMerchantsWeek] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [trend, setTrend] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sb = createClient();
    const startOfDay = startOfLocalDay();
    const trendStart = new Date(startOfDay);
    trendStart.setDate(startOfDay.getDate() - (ADMIN_DASHBOARD_TREND_DAYS - 1));

    try {
      const closedFilter = `(${CLOSED_COMPLAINT_STATUSES.map((s) => `"${s}"`).join(',')})`;
      const [
        oc,
        pc,
        today,
        complaints,
        merchants,
        settlements,
        newMerchants,
        recent,
        trendRes,
        revenueRes,
      ] = await Promise.all([
        sb.from('orders').select('id', { count: 'exact', head: true }),
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString()),
        sb
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', closedFilter),
        sb
          .from('merchants')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        sb
          .from('settlements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        sb
          .from('merchants')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', trendStart.toISOString()),
        sb
          .from('audit_logs')
          .select('id, occurred_at, kind, action, title, detail')
          .order('occurred_at', { ascending: false })
          .limit(6),
        sb
          .from('orders')
          .select('created_at')
          .gte('created_at', trendStart.toISOString())
          .order('created_at', { ascending: true })
          .limit(2000),
        sb
          .from('orders')
          .select('created_at, collected_at, total, order_status')
          .gte('created_at', trendStart.toISOString())
          .in('order_status', ['collected', 'completed'])
          .order('created_at', { ascending: true })
          .limit(2000),
      ]);

      setOrdersCount(typeof oc.count === 'number' ? oc.count : null);
      setProfilesCount(typeof pc.count === 'number' ? pc.count : null);
      setTodaysOrders(typeof today.count === 'number' ? today.count : null);
      setOpenComplaints(typeof complaints.count === 'number' ? complaints.count : null);
      setPendingMerchants(typeof merchants.count === 'number' ? merchants.count : null);
      setPendingSettlements(typeof settlements.count === 'number' ? settlements.count : null);
      setNewMerchantsWeek(typeof newMerchants.count === 'number' ? newMerchants.count : null);

      setRecentEvents(
        (recent.data ?? []).map((r) => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
          detail: String(r.detail ?? ''),
          kind: String(r.kind ?? ''),
          action: String(r.action ?? ''),
          at: typeof r.occurred_at === 'string' ? r.occurred_at : null,
        })),
      );

      const buckets = [];
      const revenueBuckets = [];
      for (let i = 0; i < ADMIN_DASHBOARD_TREND_DAYS; i += 1) {
        const d = new Date(trendStart);
        d.setDate(trendStart.getDate() + i);
        buckets.push({
          label: ADMIN_DASHBOARD_TREND_DAY_LABELS[d.getDay()],
          date: d,
          count: 0,
        });
        revenueBuckets.push({
          label: ADMIN_DASHBOARD_TREND_DAY_LABELS[d.getDay()],
          date: d,
          amount: 0,
        });
      }

      (trendRes.data ?? []).forEach((r) => {
        if (typeof r.created_at !== 'string') return;
        const idx = bucketIndexForDate(trendStart, new Date(r.created_at), ADMIN_DASHBOARD_TREND_DAYS);
        if (idx >= 0 && idx < ADMIN_DASHBOARD_TREND_DAYS) buckets[idx].count += 1;
      });

      (revenueRes.data ?? []).forEach((r) => {
        const status = String(r.order_status ?? '');
        if (!SETTLED_ORDER_STATUSES.has(status)) return;
        const raw = r.collected_at ?? r.created_at;
        if (typeof raw !== 'string') return;
        const idx = bucketIndexForDate(trendStart, new Date(raw), ADMIN_DASHBOARD_TREND_DAYS);
        if (idx < 0 || idx >= ADMIN_DASHBOARD_TREND_DAYS) return;
        const total = Number(r.total ?? 0);
        if (Number.isFinite(total)) revenueBuckets[idx].amount += total;
      });

      setTrend(buckets);
      setRevenueTrend(revenueBuckets);
    } catch (e) {
      setError(e?.message ?? 'Could not load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ordersCount,
    profilesCount,
    todaysOrders,
    openComplaints,
    pendingMerchants,
    pendingSettlements,
    newMerchantsWeek,
    recentEvents,
    trend,
    revenueTrend,
    loading,
    error,
    reload,
  };
}

export function buildAdminExportRows(input) {
  const totalRevenue = (input.revenueTrend ?? []).reduce(
    (sum, b) => sum + (Number.isFinite(b.amount) ? b.amount : 0),
    0,
  );
  const fmt = (n) => (n == null ? '—' : String(n));
  return [
    { label: 'Date', value: new Date().toISOString().slice(0, 10) },
    { label: 'Orders (today)', value: fmt(input.todaysOrders) },
    { label: 'Orders (all-time)', value: fmt(input.ordersCount) },
    {
      label: 'Revenue (last 7 days, LKR)',
      value: `Rs. ${Math.round(totalRevenue).toLocaleString()}`,
    },
    { label: 'New merchants (7d)', value: fmt(input.newMerchantsWeek) },
    { label: 'Open complaints', value: fmt(input.openComplaints) },
    { label: 'Pending merchant applications', value: fmt(input.pendingMerchants) },
    { label: 'Pending settlements', value: fmt(input.pendingSettlements) },
  ];
}

export function rowsToCsv(rows) {
  const escape = (s) => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = 'metric,value';
  const body = rows.map((r) => `${escape(r.label)},${escape(r.value)}`).join('\n');
  return `${header}\n${body}\n`;
}
