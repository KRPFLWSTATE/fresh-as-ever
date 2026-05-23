'use client';

import { HandCoins, Clock, CheckCircle, ArrowCircleUp, Bank } from '@phosphor-icons/react';
import { useMerchantFinance } from '@/hooks/useMerchantFinance';

export default function MerchantFinancePage() {
  const { summary, history, loading, error } = useMerchantFinance();

  const financeKpis = [
    {
      label: 'Gross sales (all time)',
      value: summary.lifetime,
      icon: HandCoins,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Pending payout',
      value: summary.pending,
      icon: Clock,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Paid out (settlements)',
      value: summary.paidOut,
      icon: Bank,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
            Earnings & Payouts
          </p>
          <h1 className="font-display text-h1 md:text-display text-text">Financial Hub</h1>
        </div>
      </div>

      {error ? <p className="font-body-sm text-error">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg">
        {financeKpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-surface rounded-[2.5rem] p-xl border border-divider shadow-elevation-sm"
            >
              <div className="flex items-center justify-between mb-xl">
                <span className="font-label text-sm font-bold text-text-muted uppercase tracking-wider">
                  {k.label}
                </span>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${k.bg} ${k.color}`}>
                  <Icon size={24} weight="fill" />
                </div>
              </div>
              <span className="font-display text-3xl font-black text-text block">
                {loading ? '…' : k.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm">
        <h2 className="font-h3 text-h3 text-text mb-xl">Settlement history</h2>
        {loading ? (
          <div className="space-y-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-2 animate-pulse rounded-3xl border border-divider" />
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="divide-y divide-divider">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-6">
                <div className="flex items-center gap-md">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                    <ArrowCircleUp size={28} weight="fill" />
                  </div>
                  <div>
                    <p className="font-label text-lg font-bold text-text">{p.id.slice(0, 8)}</p>
                    <p className="font-body-sm text-text-muted flex items-center gap-2">
                      <CheckCircle size={14} weight="fill" className="text-success" />
                      {p.date} · {p.status}
                    </p>
                  </div>
                </div>
                <span className="font-display text-2xl font-black text-text">{p.amount}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body-md text-text-muted">
            No settlements yet. Payouts appear here after platform settlement runs.
          </p>
        )}
      </div>
    </main>
  );
}
