'use client';

import { Tag, Plus, MagnifyingGlass, Clock, CheckCircle, Pause, Trash } from '@phosphor-icons/react';

export default function PromosPage() {
  const promos = [
    { code: 'WELCOME50', discount: '50% Off', limit: 'First Order', uses: 450, status: 'active', expiry: 'Dec 31' },
    { code: 'RESCUE20', discount: '20% Off', limit: 'All Users', uses: 1250, status: 'active', expiry: 'Nov 30' },
    { code: 'BREAD10', discount: '10% Off', limit: 'Bakery Only', uses: 320, status: 'paused', expiry: 'Oct 31' },
    { code: 'FLASH', discount: 'Rs. 200 Off', limit: 'Next 24h', uses: 890, status: 'expired', expiry: 'Oct 15' }
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Growth & Marketing</p>
          <h1 className="font-display text-h1 text-text">Promotions</h1>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-label font-bold shadow-elevation-md transition-all active:scale-95">
          <Plus size={20} weight="bold" />
          Create Promo Code
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row gap-md">
        <div className="flex-1 relative group">
          <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search active promo codes..." 
            className="w-full bg-surface border border-divider rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md shadow-elevation-sm"
          />
        </div>
      </div>

      {/* Promos Table */}
      <div className="bg-surface rounded-[2rem] border border-divider shadow-elevation-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-6 gap-md p-6 bg-surface-2 border-b border-divider font-label text-xs font-bold text-text-muted uppercase tracking-widest">
          <span>Code</span>
          <span>Discount</span>
          <span>Limit</span>
          <span>Uses</span>
          <span>Status</span>
          <span className="text-right">Expiry</span>
        </div>

        <div className="divide-y divide-divider">
          {promos.map((p, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-md p-6 items-center hover:bg-surface-2 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <Tag size={20} weight="fill" />
                </div>
                <span className="font-display text-lg font-black text-text">{p.code}</span>
              </div>
              
              <span className="font-label text-sm font-bold text-primary">{p.discount}</span>
              
              <span className="hidden md:block font-body-sm text-sm text-text-muted">{p.limit}</span>
              
              <div className="hidden md:flex items-center gap-2 text-text-muted">
                <span className="font-display text-lg font-bold text-text">{p.uses.toLocaleString()}</span>
                <span className="font-label text-[10px] uppercase tracking-tighter">Uses</span>
              </div>

              <div className="flex items-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${
                  p.status === 'active' 
                    ? 'bg-success/10 text-success border-success/20' 
                    : p.status === 'paused'
                    ? 'bg-surface-2 text-text-muted border-divider'
                    : 'bg-error/10 text-error border-error/20'
                }`}>
                  {p.status === 'active' ? (
                    <CheckCircle size={14} weight="fill" />
                  ) : p.status === 'paused' ? (
                    <Pause size={14} weight="bold" />
                  ) : (
                    <Trash size={14} weight="bold" />
                  )}
                  {p.status}
                </span>
              </div>

              <div className="text-right flex flex-col md:block">
                <span className="font-body-sm text-sm text-text-muted flex items-center justify-end gap-1.5">
                  <Clock size={14} weight="bold" />
                  {p.expiry}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

