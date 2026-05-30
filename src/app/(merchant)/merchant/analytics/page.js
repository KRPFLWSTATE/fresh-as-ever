'use client';

import { useState } from 'react';
import { ShoppingBag, HandCoins, Star, Leaf, UsersThree } from '@phosphor-icons/react';
import { useMerchantReviews } from '@/hooks/useMerchantReviews';
import { useMerchantAnalytics } from '@/hooks/useMerchantAnalytics';

export default function MerchantAnalyticsPage() {
  const [windowDays, setWindowDays] = useState(30);
  const { snapshot, loading, error } = useMerchantAnalytics(windowDays);
  const { reviews, averageRating, loading: reviewsLoading } = useMerchantReviews();
  const avgRating =
    reviews.length > 0 ? Number(averageRating || 0).toFixed(1) : 'No reviews yet';

  const kpis = [
    {
      l: 'Revenue',
      v: loading ? '…' : snapshot?.revenueLabel ?? 'LKR 0',
      d: `Last ${windowDays} days`,
      i: HandCoins,
      c: 'text-success',
      bg: 'bg-success/10',
    },
    {
      l: 'Customers',
      v: loading ? '…' : String(snapshot?.customerReach ?? 0),
      d: 'Unique in window',
      i: UsersThree,
      c: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      l: 'Avg Rating',
      v: avgRating,
      d: `${reviews.length} reviews`,
      i: Star,
      c: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      l: 'Surplus recovered',
      v: loading ? '…' : snapshot?.surplusRecoveredLabel ?? 'LKR 0',
      d: `Retail value · last ${windowDays} days`,
      i: HandCoins,
      c: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      l: 'Waste prevented',
      v: loading ? '…' : `${snapshot?.wasteKg ?? 0} kg`,
      d: `CO₂ est. ${snapshot?.co2Kg ?? 0} kg`,
      i: Leaf,
      c: 'text-success',
      bg: 'bg-success/5',
    },
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
            Business Intelligence
          </p>
          <h1 className="font-display text-h1 md:text-display text-text">Performance Insights</h1>
        </div>
        <select
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
          className="bg-surface border border-divider rounded-xl px-4 py-2 font-label"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error ? <p className="font-body-sm text-error">{error}</p> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md md:gap-lg">
        {kpis.map((k) => {
          const Icon = k.i;
          return (
            <div key={k.l} className="bg-surface rounded-[2.5rem] p-lg border border-divider shadow-elevation-sm">
              <div className="flex items-center justify-between mb-md">
                <span className="font-label text-xs font-bold text-text-muted uppercase">{k.l}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.bg} ${k.c}`}>
                  <Icon size={20} weight="fill" />
                </div>
              </div>
              <span className="font-display text-2xl font-black text-text block">{k.v}</span>
              <span className="font-label text-[10px] font-bold text-text-muted uppercase mt-1">{k.d}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="bg-surface rounded-[3rem] p-xl border border-divider">
          <h3 className="font-h3 text-h3 text-text mb-md">Popular times (by hour)</h3>
          <p className="font-body-sm text-text-muted mb-lg">
            Peak: {snapshot?.peakHour ?? '—'}
          </p>
          <div className="flex items-end gap-1 h-32">
            {(snapshot?.hourBuckets ?? []).filter((_, h) => h % 4 === 0).map((b) => {
              const max = Math.max(1, ...(snapshot?.hourBuckets ?? []).map((x) => x.count));
              return (
                <div
                  key={b.hour}
                  className="flex-1 bg-primary/80 rounded-t-md min-h-[4px]"
                  style={{ height: `${Math.max(4, (b.count / max) * 100)}%` }}
                  title={`${b.hour}:00 — ${b.count} orders`}
                />
              );
            })}
          </div>
        </div>

        <div className="bg-surface rounded-[3rem] p-xl border border-divider">
          <h3 className="font-h3 text-h3 text-text mb-xl">Top selling bags</h3>
          {(snapshot?.topBags ?? []).length === 0 ? (
            <p className="font-body-sm text-text-muted">No collected orders in this window.</p>
          ) : (
            <div className="space-y-md">
              {snapshot.topBags.map((b) => (
                <div key={b.bagId} className="flex items-center justify-between p-4 rounded-2xl bg-surface-2">
                  <div className="flex items-center gap-md">
                    <ShoppingBag size={24} className="text-primary" />
                    <span className="font-label font-bold text-text">{b.title}</span>
                  </div>
                  <span className="font-label text-primary font-bold">
                    {b.units} · LKR {Math.round(b.revenue).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-[3rem] p-xl border border-divider">
        <h3 className="font-h3 text-h3 text-text mb-xl">Latest feedback</h3>
        {reviewsLoading ? (
          <p className="font-body-sm text-text-muted">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="font-body-sm text-text-muted">No customer reviews yet.</p>
        ) : (
          <div className="space-y-md">
            {reviews.slice(0, 6).map((f) => (
              <div key={f.id} className="p-6 bg-surface-2 rounded-2xl border border-divider">
                <p className="font-body-md text-text italic mb-2">
                  &ldquo;{f.comment || 'No comment'}&rdquo;
                </p>
                <span className="font-label text-xs text-text-muted">
                  {f.customerName} · {f.rating}/5
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
