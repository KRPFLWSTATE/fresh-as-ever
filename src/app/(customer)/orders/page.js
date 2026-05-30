'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Receipt, 
  Storefront, 
  Clock, 
  QrCode, 
  CheckCircle, 
  ClockCountdown, 
  ClockCounterClockwise 
} from '@phosphor-icons/react';
import { useOrders } from '@/hooks/useOrders';
import { ORDER_STATUSES, formatPickupRangeLabel } from '@/lib/utils';
import { orderDisplayTitle, orderPickupWindow } from '@/lib/orderDisplay';

export default function OrdersPage() {
  const { activeOrders, pastOrders, loading } = useOrders();
  const [tab, setTab] = useState('active');
  const visibleActiveOrders = activeOrders;
  const visiblePastOrders = pastOrders;
  const isLoadingOrders = loading;

  return (
    <div className="min-h-screen bg-background">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-divider flex justify-between items-center w-full px-page-margin-mobile md:px-page-margin-desktop h-16">
        <div className="flex items-center gap-3">
          <Link href="/discover" className="flex items-center gap-2">
            <img src="/logo.png" alt="Fresh As Ever" className="h-8 w-auto" />
            <span className="font-display text-lg tracking-tight text-primary font-extrabold hidden sm:inline-block">Fresh As Ever</span>
          </Link>
        </div>
        <Link href="/profile" className="w-10 h-10 rounded-full bg-surface-2 border border-divider overflow-hidden flex items-center justify-center hover:bg-surface-2 transition-colors">
          <User size={20} weight="bold" className="text-text-muted" />
        </Link>
      </header>

      <main className="pt-8 px-page-margin-mobile md:px-page-margin-desktop max-w-4xl mx-auto pb-32">
        <div className="mb-xl">
          <h1 className="font-display text-h1 text-text mb-2">Orders</h1>
          <p className="font-body-md text-text-muted font-medium">Manage your rescues and pickups.</p>
        </div>

        {/* Tab Control */}
        <div className="bg-surface-2 p-1.5 rounded-2xl flex mb-xl shadow-inner border border-divider">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-3 text-center rounded-xl font-label text-sm font-bold transition-all duration-200 ${
              tab === 'active' 
                ? 'bg-surface text-primary shadow-elevation-sm' 
                : 'text-text-muted hover:text-text'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`flex-1 py-3 text-center rounded-xl font-label text-sm font-bold transition-all duration-200 ${
              tab === 'archived' 
                ? 'bg-surface text-primary shadow-elevation-sm' 
                : 'text-text-muted hover:text-text'
            }`}
          >
            History
          </button>
        </div>

        {/* Loading */}
        {isLoadingOrders && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface p-6 rounded-3xl border border-divider h-32 animate-pulse" />
            ))}
          </div>
        )}

        {/* Active Orders */}
        {!isLoadingOrders && tab === 'active' && (
          <div className="grid gap-4">
            {visibleActiveOrders.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-[32px] border-2 border-dashed border-divider flex flex-col items-center">
                <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-6 text-text-faint">
                  <Receipt size={48} weight="thin" />
                </div>
                <h3 className="font-h3 text-h3 text-text">No active orders</h3>
                <p className="font-body-md text-text-muted mt-2">Your rescued food orders will appear here.</p>
                <Link href="/discover" className="mt-8 bg-primary text-white px-8 py-3.5 rounded-2xl font-label font-bold hover:shadow-elevation-md transition-all active:scale-95 shadow-elevation-sm">
                  Discover bags
                </Link>
              </div>
            ) : (
              visibleActiveOrders.map((order) => {
                const status = ORDER_STATUSES[order.order_status] || { label: order.order_status, color: 'text-text-muted', bg: 'bg-surface-2' };
                const pickup = orderPickupWindow(order);
                const isShelf = Boolean(order.shelf_id);
                return (
                  <Link href={`/orders/${order.id}`} key={order.id} className="group">
                    <div className="bg-surface p-6 rounded-3xl shadow-elevation-sm border border-divider flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-elevation-md transition-all duration-200 active:scale-[0.98]">
                      <div className="bg-primary-highlight w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-primary/10 shadow-inner">
                        <QrCode size={32} weight="bold" className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${status.bg} ${status.color} px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider`}>
                            {status.label}
                          </span>
                          <span className="font-label text-[10px] text-text-faint font-bold tracking-widest uppercase">ID: {order.id?.slice(0, 8)}</span>
                        </div>
                        {isShelf ? (
                          <span className="inline-flex mb-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-accent/10 text-accent">
                            Clearance shelf
                          </span>
                        ) : null}
                        <h3 className="font-display text-xl text-text mb-1.5 group-hover:text-primary transition-colors truncate font-bold">
                          {orderDisplayTitle(order)}
                        </h3>
                        <div className="flex items-center gap-2 font-body-sm text-text-muted">
                          <Storefront size={18} weight="bold" className="text-primary/60" />
                          <span className="truncate">{order.outlet?.name || 'Merchant'}</span>
                        </div>
                      </div>
                      <div className="bg-surface-2 rounded-2xl p-4 flex flex-col items-end text-right shrink-0 w-full md:max-w-[220px] border border-divider shadow-sm gap-1">
                        <div className="font-label text-[10px] text-text-muted uppercase tracking-widest font-bold w-full">
                          Pickup Window
                        </div>
                        <div className="flex items-start gap-2 justify-end w-full">
                          <Clock size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                          <span className="font-display text-sm sm:text-lg text-text font-bold leading-snug break-words">
                            {formatPickupRangeLabel(pickup.start, pickup.end) ||
                              `${pickup.start || '—'} – ${pickup.end || '—'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* Archived Orders */}
        {!isLoadingOrders && tab === 'archived' && (
          <div className="grid gap-3">
            {visiblePastOrders.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center">
                <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-6 text-text-faint">
                  <ClockCounterClockwise size={48} weight="thin" />
                </div>
                <h3 className="font-h3 text-h3 text-text">No past orders yet</h3>
                <p className="font-body-md text-text-muted mt-2">Your completed orders will be archived here.</p>
              </div>
            ) : (
              visiblePastOrders.map((order) => (
                <Link href={`/orders/${order.id}`} key={order.id}>
                  <div className="bg-surface p-5 rounded-3xl flex items-center gap-5 hover:bg-surface-2 transition-all border border-divider shadow-elevation-sm active:scale-[0.99]">
                    <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center shrink-0 border border-success/10 shadow-inner">
                      <CheckCircle size={24} weight="fill" className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-h3 text-h3 text-text truncate">{order.bag?.title || 'Rescue Bag'}</h3>
                      <div className="font-body-xs text-text-muted truncate mt-0.5">
                        {order.outlet?.name} • {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg text-primary font-bold">Rs. {order.total?.toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

