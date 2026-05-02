'use client';

import { HandCoins, Clock, CheckCircle, ArrowCircleUp, Bank, ArrowRight, Circle } from '@phosphor-icons/react';
import { useMerchantFinance } from '@/hooks/useMerchantFinance';

export default function MerchantFinancePage() {
  const { stats, payouts, loading } = useMerchantFinance();

  const financeKpis = [
    { label: 'Total Revenue', value: `Rs. ${stats?.total_revenue?.toLocaleString() || '0'}`, icon: HandCoins, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending Payout', value: `Rs. ${stats?.pending_payout?.toLocaleString() || '0'}`, icon: Clock, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Settled to Bank', value: `Rs. ${stats?.completed_payouts?.toLocaleString() || '0'}`, icon: Bank, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Earnings & Payouts</p>
          <h1 className="font-display text-h1 md:text-display text-text">Financial Hub</h1>
        </div>
        <div className="flex items-center gap-sm bg-surface-2 px-4 py-2 rounded-full border border-divider shadow-sm w-fit">
          <Circle size={12} weight="fill" className="text-success animate-pulse" />
          <span className="font-label text-sm font-semibold text-text-muted">Secure Payments</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg">
        {financeKpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-surface rounded-[2.5rem] p-xl border border-divider shadow-elevation-sm hover:shadow-elevation-md transition-all group">
              <div className="flex items-center justify-between mb-xl">
                <span className="font-label text-sm font-bold text-text-muted uppercase tracking-wider">{k.label}</span>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-divider/50 transition-transform group-hover:scale-110 ${k.bg} ${k.color}`}>
                  <Icon size={24} weight="fill" />
                </div>
              </div>
              <span className="font-display text-3xl font-black text-text block">{loading ? '...' : k.value}</span>
            </div>
          );
        })}
      </div>

      {/* Payout History Section */}
      <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm">
        <div className="flex items-center justify-between mb-xl">
          <h2 className="font-h3 text-h3 text-text">Payout History</h2>
          <button className="bg-surface-2 hover:bg-surface-2 text-text-muted hover:text-text px-5 py-2.5 rounded-full font-label text-xs font-bold transition-all flex items-center gap-2 border border-divider">
            Statement History
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-md">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-2 animate-pulse rounded-3xl border border-divider" />)}
          </div>
        ) : payouts?.length > 0 ? (
          <div className="divide-y divide-divider">
            {payouts.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-6 first:pt-0 last:pb-0 hover:bg-surface-2/50 transition-colors cursor-pointer group px-4 -mx-4 rounded-3xl">
                <div className="flex items-center gap-md">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/20 group-hover:scale-110 transition-transform">
                    <ArrowCircleUp size={28} weight="fill" />
                  </div>
                  <div>
                    <p className="font-label text-lg font-bold text-text mb-0.5">{p.reference || 'Bank Transfer'}</p>
                    <p className="font-body-sm text-sm text-text-muted flex items-center gap-2">
                      <CheckCircle size={14} weight="fill" className="text-success" />
                      {p.date || 'Completed Recently'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-black text-text">Rs. {p.amount?.toLocaleString() || '0'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 opacity-50">
            <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-6 border border-divider">
              <HandCoins size={40} weight="thin" className="text-text-faint" />
            </div>
            <p className="font-display text-xl font-bold text-text-muted">No payout history available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}

