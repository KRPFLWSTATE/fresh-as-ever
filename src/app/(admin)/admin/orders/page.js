'use client';

import { Receipt, Storefront, User, CheckCircle, Clock, MagnifyingGlass } from '@phosphor-icons/react';

export default function PlatformOrdersPage() {
  const orders = [
    { id: 'ORD-9921', bag: 'Pastry Box', merchant: 'Cafe Kumbuk', customer: 'Amara S.', status: 'ready_for_pickup', total: 'Rs. 500' },
    { id: 'ORD-9945', bag: 'Bread Bundle', merchant: 'BreadTalk', customer: 'Kavin P.', status: 'paid', total: 'Rs. 350' },
    { id: 'ORD-9950', bag: 'Mixed Groceries', merchant: 'Keells', customer: 'Nimal F.', status: 'reserved', total: 'Rs. 450' }
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Operations</p>
          <h1 className="font-display text-h1 text-text">All Orders</h1>
        </div>
        <div className="relative w-full md:w-80 group">
          <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search orders, IDs..." 
            className="w-full bg-surface border border-divider rounded-2xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md shadow-elevation-sm"
          />
        </div>
      </div>

      {/* Orders Table/List */}
      <div className="bg-surface rounded-[2rem] border border-divider shadow-elevation-sm overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-6 gap-md p-6 bg-surface-2 border-b border-divider font-label text-xs font-bold text-text-muted uppercase tracking-widest">
          <span>Order ID</span>
          <span>Bag</span>
          <span>Merchant</span>
          <span>Customer</span>
          <span>Status</span>
          <span className="text-right">Total</span>
        </div>

        {/* List Items */}
        <div className="divide-y divide-divider">
          {orders.map((o, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-md p-6 items-center hover:bg-surface-2 transition-colors cursor-pointer group">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                <Receipt size={20} weight="bold" className="text-primary/40 group-hover:text-primary transition-colors" />
                <span className="font-label text-sm font-bold text-primary">#{o.id}</span>
              </div>
              
              <span className="font-label text-sm font-bold text-text truncate">{o.bag}</span>
              
              <div className="hidden md:flex items-center gap-2 text-text-muted">
                <Storefront size={18} weight="bold" className="text-text-faint" />
                <span className="font-body-sm text-sm">{o.merchant}</span>
              </div>

              <div className="hidden md:flex items-center gap-2 text-text-muted">
                <User size={18} weight="bold" className="text-text-faint" />
                <span className="font-body-sm text-sm">{o.customer}</span>
              </div>

              <div className="flex items-center">
                {o.status === 'ready_for_pickup' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-success/10 text-success border border-success/20">
                    <CheckCircle size={14} weight="fill" />
                    Ready
                  </span>
                ) : o.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-surface-2 text-text-muted border border-divider">
                    <Clock size={14} weight="bold" />
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle size={14} weight="bold" />
                    Reserved
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="font-display text-lg font-black text-text">{o.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

