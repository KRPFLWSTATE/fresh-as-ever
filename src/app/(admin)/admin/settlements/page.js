'use client';

import { HandCoins, CheckCircle, Clock, ArrowsClockwise, Storefront, TrendUp } from '@phosphor-icons/react';

export default function SettlementsPage() {
  const settlements = [
    { merchant: 'The Bread Company', amount: 'Rs. 45,000', status: 'completed', date: 'Apr 25' },
    { merchant: 'Butter Boutique', amount: 'Rs. 32,000', status: 'completed', date: 'Apr 25' },
    { merchant: 'Cafe Kumbuk', amount: 'Rs. 18,500', status: 'pending', date: 'Apr 28' },
    { merchant: 'Fresh Bites Deli', amount: 'Rs. 12,000', status: 'processing', date: 'Apr 27' }
  ];

  const stats = [
    { label: 'Total Settled', value: 'Rs. 1.2M', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', trend: '+8%' },
    { label: 'Pending', value: 'Rs. 95k', icon: Clock, color: 'text-accent', bg: 'bg-accent/10', trend: '+2%' },
    { label: 'Processing', value: 'Rs. 45k', icon: ArrowsClockwise, color: 'text-primary', bg: 'bg-primary/10', trend: '-1%' }
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-12">
      {/* Header */}
      <header>
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Financial Overview</p>
        <h1 className="font-display text-h1 text-text">Settlements</h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg">
        {stats.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-surface rounded-[2rem] p-xl border border-divider shadow-elevation-sm hover:shadow-elevation-md transition-all group">
              <div className="flex items-center justify-between mb-xl">
                <span className="font-label text-sm font-bold text-text-muted uppercase tracking-wider">{k.label}</span>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-divider transition-transform group-hover:scale-110 ${k.bg} ${k.color}`}>
                  <Icon size={28} weight="fill" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="font-display text-3xl font-black text-text">{k.value}</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${k.trend.startsWith('+') ? 'text-success bg-success/5' : 'text-accent bg-accent/5'}`}>
                  <TrendUp size={14} weight="bold" />
                  {k.trend}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settlements Table */}
      <div className="bg-surface rounded-[2rem] border border-divider shadow-elevation-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-4 gap-md p-6 bg-surface-2 border-b border-divider font-label text-xs font-bold text-text-muted uppercase tracking-widest">
          <span>Merchant</span>
          <span>Settlement Amount</span>
          <span>Status</span>
          <span className="text-right">Date</span>
        </div>

        <div className="divide-y divide-divider">
          {settlements.map((s, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-md p-6 items-center hover:bg-surface-2 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-text-faint group-hover:text-primary transition-colors border border-divider">
                  <Storefront size={20} weight="bold" />
                </div>
                <span className="font-label text-sm font-bold text-text">{s.merchant}</span>
              </div>
              
              <span className="font-display text-lg font-black text-primary">{s.amount}</span>
              
              <div className="flex items-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${
                  s.status === 'completed' 
                    ? 'bg-success/10 text-success border-success/20' 
                    : s.status === 'pending'
                    ? 'bg-accent/10 text-accent border-accent/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    s.status === 'completed' ? 'bg-success' : s.status === 'pending' ? 'bg-accent' : 'bg-primary'
                  }`} />
                  {s.status}
                </span>
              </div>

              <div className="text-right">
                <span className="font-body-sm text-sm text-text-muted">{s.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

