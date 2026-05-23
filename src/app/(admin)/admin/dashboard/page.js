'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChartLineUp,
  Circle,
  Leaf,
  Storefront,
  TrendUp,
} from '@phosphor-icons/react';
import {
  buildAdminExportRows,
  rowsToCsv,
  useAdminDashboardMetrics,
} from '@/hooks/useAdminDashboardMetrics';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const view = searchParams?.get('view');
  const isColomboView = view === 'colombo';
  const metrics = useAdminDashboardMetrics();
  const [exportCopied, setExportCopied] = useState(false);

  useEffect(() => {
    void metrics.reload();
  }, [metrics.reload]);

  const totalRescues = metrics.ordersCount ?? 0;
  const trendTotal = useMemo(
    () => (metrics.trend ?? []).reduce((s, b) => s + b.count, 0),
    [metrics.trend],
  );
  const revenue7d = useMemo(
    () =>
      (metrics.revenueTrend ?? []).reduce(
        (s, b) => s + (Number.isFinite(b.amount) ? b.amount : 0),
        0,
      ),
    [metrics.revenueTrend],
  );
  const co2Est = Math.round(revenue7d * 0.12 * 10) / 10;

  const exportRows = buildAdminExportRows({
    todaysOrders: metrics.todaysOrders,
    ordersCount: metrics.ordersCount,
    revenueTrend: metrics.revenueTrend,
    newMerchantsWeek: metrics.newMerchantsWeek,
    openComplaints: metrics.openComplaints,
    pendingMerchants: metrics.pendingMerchants,
    pendingSettlements: metrics.pendingSettlements,
  });

  const onExport = async () => {
    const csv = rowsToCsv(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fae-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportCopied(true);
  };

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
            Platform Analytics
          </p>
          <h1 className="font-display text-h1 md:text-display text-text">
            {isColomboView ? 'Colombo Regional Overview' : 'Platform Overview'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <button
            type="button"
            onClick={() => void onExport()}
            className="bg-primary text-white font-label text-sm font-bold px-4 py-2 rounded-full"
          >
            {exportCopied ? 'CSV downloaded' : 'Export report'}
          </button>
          <div className="flex items-center gap-sm bg-surface-2 px-4 py-2 rounded-full border border-divider shadow-sm w-fit">
            <Circle size={12} weight="fill" className="text-success animate-pulse" />
            <span className="font-label text-sm font-semibold text-text-muted">Live data</span>
          </div>
        </div>
      </header>

      {metrics.error ? (
        <p className="font-body-sm text-error">{metrics.error}</p>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-lg">
        <div className="md:col-span-8 bg-primary rounded-[2rem] p-lg md:p-xl flex flex-col justify-between relative overflow-hidden shadow-elevation-lg group h-[320px]">
          <div className="relative z-10">
            <h3 className="font-h3 text-h3 text-white/80 mb-xs">
              {isColomboView ? 'Orders (7-day trend)' : 'Total orders (platform)'}
            </h3>
            <p className="font-body-md text-white/50">
              {metrics.loading ? 'Loading…' : `${trendTotal} orders in last 7 days`}
            </p>
          </div>
          <div className="relative z-10 flex items-baseline gap-sm">
            <span className="font-display text-7xl md:text-8xl font-black text-white tracking-tighter">
              {metrics.loading ? '…' : totalRescues.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <TrendUp size={18} weight="bold" />
              <span className="font-label text-sm font-bold">
                Rs. {Math.round(revenue7d).toLocaleString()} / 7d
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-md">
          <div className="bg-surface rounded-[2rem] p-lg flex-1 flex flex-col justify-center border border-divider shadow-elevation-sm">
            <span className="font-label text-sm font-semibold text-text-muted uppercase tracking-wider">
              Active merchants (profiles)
            </span>
            <span className="font-display text-5xl font-black text-text mt-sm">
              {metrics.loading ? '…' : (metrics.profilesCount ?? 0).toLocaleString()}
            </span>
            <p className="font-body-sm text-text-muted mt-2">
              Pending applications: {metrics.pendingMerchants ?? 0}
            </p>
          </div>
          <div className="bg-surface rounded-[2rem] p-lg flex-1 flex flex-col justify-center border border-divider shadow-elevation-sm">
            <span className="font-label text-sm font-semibold text-text-muted uppercase tracking-wider">
              Est. CO₂ saved (7d, kg)
            </span>
            <span className="font-display text-5xl font-black text-text mt-sm">
              {metrics.loading ? '…' : co2Est}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-lg md:gap-xl pb-12">
        <div className="bg-surface rounded-[2rem] p-xl border border-divider shadow-elevation-sm">
          <h3 className="font-h3 text-h3 text-text mb-md">Recent audit events</h3>
          <ul className="space-y-md">
            {(metrics.recentEvents ?? []).length === 0 ? (
              <li className="font-body-sm text-text-muted">No recent events.</li>
            ) : (
              metrics.recentEvents.map((ev) => (
                <li key={ev.id} className="border-b border-divider pb-sm last:border-0">
                  <p className="font-label font-bold text-text">{ev.title || ev.action}</p>
                  <p className="font-body-sm text-text-muted">{ev.detail}</p>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="bg-surface rounded-[2rem] p-xl border border-divider shadow-elevation-sm">
          <h3 className="font-h3 text-h3 text-text mb-md">Ops snapshot</h3>
          <ul className="space-y-sm font-body-md text-text-muted">
            <li>Today&apos;s orders: {metrics.todaysOrders ?? '—'}</li>
            <li>Open complaints: {metrics.openComplaints ?? '—'}</li>
            <li>Pending settlements: {metrics.pendingSettlements ?? '—'}</li>
            <li>New merchants (7d): {metrics.newMerchantsWeek ?? '—'}</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading dashboard…</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
