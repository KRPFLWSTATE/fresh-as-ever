'use client';

import Link from 'next/link';
import { Storefront, CheckCircle, Clock, MagnifyingGlass, Plus } from '@phosphor-icons/react';

export default function AdminMerchantsPage() {
  const merchants = [
    { n: 'The Bread Company', a: 'Colombo 07', s: 'verified', r: 342, i: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200' },
    { n: 'Butter Boutique', a: 'Colombo 03', s: 'verified', r: 289, i: 'https://images.unsplash.com/photo-1555503465-4356405bc141?auto=format&fit=crop&q=80&w=200' },
    { n: 'Fresh Bites Deli', a: 'Colombo 05', s: 'pending', r: 0, i: 'https://images.unsplash.com/photo-1540189567004-7169676c3f0b?auto=format&fit=crop&q=80&w=200' },
    { n: 'Cafe Kumbuk', a: 'Colombo 07', s: 'verified', r: 156, i: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200' }
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Platform Management</p>
          <h1 className="font-display text-h1 text-text">Merchants</h1>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-label font-bold shadow-elevation-md transition-all active:scale-95">
          <Plus size={20} weight="bold" />
          Add New Merchant
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-md items-center">
        <div className="flex-1 relative w-full group">
          <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search merchants by name or location..." 
            className="w-full bg-surface border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md shadow-elevation-sm"
          />
        </div>
        <div className="bg-surface-2 p-1.5 rounded-2xl flex border border-divider w-full md:w-auto shadow-elevation-sm">
          {['All', 'Verified', 'Pending'].map((tab) => (
            <button 
              key={tab}
              className={`px-6 py-2 rounded-xl font-label text-sm font-bold transition-all ${
                tab === 'All' 
                  ? 'bg-white text-primary shadow-elevation-md' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {merchants.map((m, i) => (
          <Link href={`/admin/merchants/${i}`} key={i} className="group">
            <div className="bg-surface p-md rounded-3xl border border-divider shadow-elevation-sm flex items-center gap-md hover:shadow-elevation-lg hover:border-primary/20 transition-all group-hover:-translate-y-1">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-2 shrink-0 border border-divider">
                <img src={m.i} alt={m.n} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-h3 text-h3 text-text truncate">{m.n}</h3>
                  {m.s === 'verified' && <CheckCircle size={18} weight="fill" className="text-success shrink-0" />}
                </div>
                <p className="font-body-sm text-text-muted flex items-center gap-1.5 mb-2">
                  <Storefront size={16} weight="bold" className="text-primary/60" />
                  {m.a}
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-label text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                    {m.r} Rescues
                  </span>
                  {m.s === 'pending' && (
                    <span className="font-label text-xs font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Clock size={14} weight="bold" />
                      Awaiting Review
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2 text-text-faint group-hover:text-primary transition-colors">
                <Plus size={24} weight="bold" className="rotate-45" /> {/* Just a decorative element or link arrow */}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

