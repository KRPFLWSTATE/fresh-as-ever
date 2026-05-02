'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QrCode, User, Receipt, ArrowRight, CheckCircle, Info, Circle, WarningCircle } from '@phosphor-icons/react';
import { useMerchantOrders } from '@/hooks/useMerchantOrders';
import { ACTIVE_ORDER_STATUSES, normalizeOrderStatus } from '@/lib/utils';

function MerchantOrdersContent() {
  const searchParams = useSearchParams();
  const { orders, loading, error, manualVerifyOrder, markNoShow } = useMerchantOrders();
  const view = searchParams?.get('view') || 'all';
  const statusFilter = searchParams?.get('status') || 'all';

  const viewMeta = {
    all: {
      title: 'Active Orders',
      subtitle: 'Order Management',
    },
    verification: {
      title: 'Orders Verification',
      subtitle: 'Handover Validation',
    },
    'review-pending': {
      title: 'Review Pending Orders',
      subtitle: 'Operational Follow-up',
    },
    'late-pickups': {
      title: 'Late Pickup Management',
      subtitle: 'Pickup Risk Monitoring',
    },
    'live-monitor': {
      title: 'Live Merchant Monitor',
      subtitle: 'Rush-Hour Tracking',
    },
  };
  const currentView = viewMeta[view] ? view : 'all';

  const filteredOrders = (orders || []).filter((order) => {
    const normalizedStatus = normalizeOrderStatus(order.status);
    if (statusFilter === 'active' && !ACTIVE_ORDER_STATUSES.includes(normalizedStatus)) return false;
    if (statusFilter !== 'all' && statusFilter !== 'active' && normalizedStatus !== normalizeOrderStatus(statusFilter)) return false;
    if (currentView === 'verification') {
      return ['ready_for_pickup', 'reserved', 'paid'].includes(normalizedStatus);
    }
    if (currentView === 'review-pending') {
      return ['reserved', 'paid'].includes(normalizedStatus);
    }
    if (currentView === 'late-pickups') {
      return ['reserved', 'paid', 'ready_for_pickup'].includes(normalizedStatus);
    }
    if (currentView === 'live-monitor') {
      return ['reserved', 'paid', 'ready_for_pickup'].includes(normalizedStatus);
    }
    return true;
  });
  const visibleOrders = filteredOrders;
  const isLoadingOrders = loading;
  
  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">{viewMeta[currentView].subtitle}</p>
          <h1 className="font-display text-h1 md:text-display text-text">{viewMeta[currentView].title}</h1>
        </div>
        <div className="flex items-center gap-sm bg-surface-2 px-4 py-2 rounded-full border border-divider shadow-sm w-fit">
          <Circle size={12} weight="fill" className="text-success animate-pulse" />
          <span className="font-label text-sm font-semibold text-text-muted">Live Verification</span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 font-label text-sm text-error max-w-xl">
          {error}
        </div>
      )}

      {isLoadingOrders ? (
        <div className="space-y-md md:space-y-lg">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface-2 animate-pulse rounded-[2.5rem] border border-divider" />)}
        </div>
      ) : (
        <div className="space-y-md md:space-y-lg">
          {visibleOrders.map((order) => (
            <div key={order.id} className="bg-surface p-lg rounded-[2.5rem] border border-divider shadow-elevation-sm flex flex-col md:flex-row gap-lg items-start md:items-center group hover:shadow-elevation-md transition-all duration-300 hover:border-primary/20">
              <div className="bg-primary-highlight w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                <QrCode size={32} weight="bold" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    normalizeOrderStatus(order.status) === 'ready_for_pickup' 
                      ? 'bg-success/10 text-success border-success/20' 
                      : 'bg-surface-2 text-text-muted border-divider'
                  }`}>
                    {normalizeOrderStatus(order.status)?.replace(/_/g, ' ')}
                  </span>
                  <span className="font-label text-[11px] font-bold text-text-faint uppercase tracking-widest">
                    #{order.reservation_code || order.id?.slice(0, 8)}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-black text-text mb-1 group-hover:text-primary transition-colors leading-tight">
                  {order.bag_title || 'Rescue Bag'}
                </h3>
                <div className="flex items-center gap-2 text-text-muted">
                  <User size={16} weight="bold" />
                  <p className="font-label text-sm font-bold uppercase tracking-tight">
                    {order.customer_name || 'Customer'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-divider">
                <button 
                  onClick={() => manualVerifyOrder(order.id)}
                  className="flex-1 min-w-[140px] md:flex-none px-10 py-4 bg-primary hover:bg-primary-hover text-white font-label text-sm font-bold rounded-2xl shadow-elevation-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} weight="bold" />
                  Mark Collected
                </button>
                {['paid', 'ready_for_pickup', 'awaiting_pickup'].includes(order.status) ? (
                  <span
                    className={loading || !order.no_show_available ? 'inline-flex cursor-help' : 'inline-flex'}
                    title={
                      order.no_show_available
                        ? undefined
                        : 'Available 30 minutes after pickup window closes'
                    }
                  >
                    <button
                      type="button"
                      disabled={loading || !order.no_show_available}
                      aria-label={
                        order.no_show_available
                          ? 'Mark no-show'
                          : 'Mark no-show: Available 30 minutes after pickup window closes'
                      }
                      onClick={() => markNoShow(order.id)}
                      className="flex-1 min-w-[140px] md:flex-none px-6 py-4 bg-surface hover:bg-surface-2 text-error border border-divider hover:border-error/30 font-label text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      <WarningCircle size={20} weight="bold" />
                      Mark No-Show
                    </button>
                  </span>
                ) : null}
                <Link 
                  href={`/merchant/orders/${order.id}`}
                  className="flex-1 min-w-[120px] md:flex-none px-6 py-4 bg-surface-2 hover:bg-surface-2 text-text font-label text-sm font-bold rounded-2xl border border-divider transition-all text-center flex items-center justify-center gap-2"
                >
                  <Info size={20} weight="bold" />
                  Details
                </Link>
              </div>
            </div>
          ))}
          
          {visibleOrders.length === 0 && (
            <div className="text-center py-24 bg-surface rounded-[3rem] border border-divider shadow-elevation-sm">
              <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-6 border border-divider">
                <Receipt size={48} weight="thin" className="text-text-faint" />
              </div>
              <p className="font-display text-2xl font-bold text-text-muted mb-2">No active orders found</p>
              <p className="font-body-md text-text-faint max-w-xs mx-auto">
                {currentView === 'late-pickups'
                  ? 'No late pickups detected right now.'
                  : 'When customers purchase your rescue bags, they will appear here for verification.'}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function MerchantOrdersPage() {
  return (
    <Suspense fallback={<main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop" />}>
      <MerchantOrdersContent />
    </Suspense>
  );
}

