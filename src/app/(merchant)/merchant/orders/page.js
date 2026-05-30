'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  QrCode,
  User,
  Receipt,
  CheckCircle,
  Info,
  Circle,
  WarningCircle,
  MapPin,
} from '@phosphor-icons/react';
import { useMerchantOrders } from '@/hooks/useMerchantOrders';
import { normalizeOrderStatus } from '@/lib/utils';
import {
  filterOrdersByView,
  sortLateOrders,
  isNoShowEligible,
} from '@/lib/merchantOrderFilters';

function MerchantOrdersContent() {
  const searchParams = useSearchParams();
  const {
    orders,
    loading,
    error,
    markNoShow,
    authorizeHandoverByCode,
    lookupHandoverByCode,
    collectGroupHandover,
  } = useMerchantOrders();
  const view = searchParams?.get('view') || 'all';
  const statusFilter = searchParams?.get('status') || 'all';
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [handoverCode, setHandoverCode] = useState('');
  const [handoverBusy, setHandoverBusy] = useState(false);
  const [handoverMsg, setHandoverMsg] = useState(null);
  const [groupPreview, setGroupPreview] = useState(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const baseFiltered = useMemo(() => {
    let rows = filterOrdersByView(orders || [], currentView, nowMs);
    if (currentView === 'late-pickups') {
      rows = sortLateOrders(rows, nowMs);
    }
    return rows.filter((order) => {
      const normalizedStatus = normalizeOrderStatus(order.status);
      if (statusFilter === 'active' && !['reserved', 'paid', 'ready_for_pickup'].includes(normalizedStatus)) {
        return false;
      }
      if (statusFilter !== 'all' && statusFilter !== 'active' && normalizedStatus !== normalizeOrderStatus(statusFilter)) {
        return false;
      }
      return true;
    });
  }, [orders, currentView, nowMs, statusFilter]);

  const arrivedHero = useMemo(
    () => (orders || []).find((o) => o.customer_arrived_at && filterOrdersByView([o], 'live-monitor', nowMs).length > 0),
    [orders, nowMs],
  );

  const handleAuthorizeCode = async () => {
    setHandoverBusy(true);
    setHandoverMsg(null);
    setGroupPreview(null);
    const lookup = await lookupHandoverByCode(handoverCode);
    if (lookup.error) {
      setHandoverMsg({ type: 'error', text: lookup.error });
      setHandoverBusy(false);
      return;
    }
    if (lookup.type === 'group' && lookup.bags.length > 1) {
      setGroupPreview(lookup);
      setHandoverBusy(false);
      return;
    }
    if (lookup.type === 'group') {
      const result = await collectGroupHandover(lookup.groupId, lookup.code);
      if (result?.error) {
        setHandoverMsg({ type: 'error', text: result.error });
      } else {
        setHandoverMsg({ type: 'success', text: 'Handover completed.' });
        setHandoverCode('');
      }
      setHandoverBusy(false);
      return;
    }
    const result = await authorizeHandoverByCode(handoverCode);
    if (result?.error) {
      setHandoverMsg({ type: 'error', text: result.error });
    } else {
      setHandoverMsg({ type: 'success', text: 'Handover completed.' });
      setHandoverCode('');
    }
    setHandoverBusy(false);
  };

  const confirmGroupHandover = async () => {
    if (!groupPreview?.groupId) return;
    setHandoverBusy(true);
    const result = await collectGroupHandover(groupPreview.groupId, groupPreview.code);
    if (result?.error) {
      setHandoverMsg({ type: 'error', text: result.error });
    } else {
      setHandoverMsg({ type: 'success', text: `Collected ${groupPreview.bags.length} bags.` });
      setHandoverCode('');
      setGroupPreview(null);
    }
    setHandoverBusy(false);
  };

  const isLoadingOrders = loading;

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
            {viewMeta[currentView].subtitle}
          </p>
          <h1 className="font-display text-h1 md:text-display text-text">{viewMeta[currentView].title}</h1>
        </div>
        <div className="flex items-center gap-sm bg-surface-2 px-4 py-2 rounded-full border border-divider shadow-sm w-fit">
          <Circle size={12} weight="fill" className="text-success animate-pulse" />
          <span className="font-label text-sm font-semibold text-text-muted">Live Verification</span>
        </div>
      </div>

      {currentView === 'live-monitor' && arrivedHero ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-lg flex items-center gap-md">
          <MapPin size={28} weight="fill" className="text-primary shrink-0" />
          <div>
            <p className="font-label text-primary font-bold">Customer at outlet</p>
            <p className="font-body-sm text-text-muted mt-1">
              {arrivedHero.customer_name} — #{arrivedHero.reservation_code || arrivedHero.id?.slice(0, 8)}
            </p>
          </div>
        </div>
      ) : null}

      {currentView === 'verification' ? (
        <div className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm space-y-sm max-w-xl">
          <p className="font-label text-text font-bold">Verify customer code</p>
          <p className="font-body-sm text-text-muted">Enter the 6-character code from the customer&apos;s order screen.</p>
          <input
            type="text"
            maxLength={6}
            value={handoverCode}
            onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
            placeholder="e.g. B32UYL"
            className="w-full bg-surface-2 border border-divider rounded-xl py-2.5 px-4 font-label tracking-widest uppercase focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAuthorizeCode}
            disabled={handoverBusy}
            className="h-11 px-5 rounded-xl bg-primary text-white font-label font-bold disabled:bg-divider"
          >
            {handoverBusy ? 'Authorizing...' : 'Authorize handover'}
          </button>
          {handoverMsg ? (
            <p className={`font-body-sm ${handoverMsg.type === 'error' ? 'text-error' : 'text-success'}`}>
              {handoverMsg.text}
            </p>
          ) : null}
          {groupPreview ? (
            <div className="rounded-xl border border-divider bg-surface-2 p-md space-y-sm">
              <p className="font-label font-bold text-text">
                Group pickup · {groupPreview.bagCount ?? groupPreview.bags.length} bags
              </p>
              <p className="font-body-sm text-text-muted">{groupPreview.customerName}</p>
              <ul className="space-y-1">
                {groupPreview.bags.map((bag) => (
                  <li key={bag.id} className="font-body-sm text-text">
                    {bag.title}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={confirmGroupHandover}
                disabled={handoverBusy}
                className="h-11 w-full rounded-xl bg-primary text-white font-label font-bold disabled:bg-divider"
              >
                {handoverBusy ? 'Collecting...' : `Collect all ${groupPreview.bags.length} bags`}
              </button>
              <button
                type="button"
                onClick={() => setGroupPreview(null)}
                className="font-label text-sm text-text-muted hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 font-label text-sm text-error max-w-xl">
          {error}
        </div>
      ) : null}

      {isLoadingOrders ? (
        <div className="space-y-md md:space-y-lg">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-2 animate-pulse rounded-[2.5rem] border border-divider" />
          ))}
        </div>
      ) : (
        <div className="space-y-md md:space-y-lg">
          {baseFiltered.map((order) => {
            const noShowOk = isNoShowEligible(order, nowMs);
            return (
              <div
                key={order.id}
                className="bg-surface p-lg rounded-[2.5rem] border border-divider shadow-elevation-sm flex flex-col md:flex-row gap-lg items-start md:items-center group hover:shadow-elevation-md transition-all duration-300 hover:border-primary/20"
              >
                <div className="bg-primary-highlight w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                  <QrCode size={32} weight="bold" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span
                      className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        normalizeOrderStatus(order.status) === 'ready_for_pickup'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-surface-2 text-text-muted border-divider'
                      }`}
                    >
                      {normalizeOrderStatus(order.status)?.replace(/_/g, ' ')}
                    </span>
                    {order.customer_arrived_at ? (
                      <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                        At outlet
                      </span>
                    ) : null}
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
                  <Link
                    href={`/merchant/orders/${order.id}`}
                    className="flex-1 min-w-[140px] md:flex-none px-10 py-4 bg-primary hover:bg-primary-hover text-white font-label text-sm font-bold rounded-2xl shadow-elevation-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} weight="bold" />
                    Verify handover
                  </Link>
                  {['paid', 'ready_for_pickup', 'awaiting_pickup', 'reserved'].includes(order.status) ? (
                    <span
                      className={loading || !noShowOk ? 'inline-flex cursor-help' : 'inline-flex'}
                      title={noShowOk ? undefined : 'Available 30 minutes after pickup window closes'}
                    >
                      <button
                        type="button"
                        disabled={loading || !noShowOk}
                        aria-label={
                          noShowOk
                            ? 'Report no-show'
                            : 'Report no-show: Available 30 minutes after pickup window closes'
                        }
                        onClick={() => markNoShow(order.id)}
                        className="flex-1 min-w-[140px] md:flex-none px-6 py-4 bg-surface hover:bg-surface-2 text-error border border-divider hover:border-error/30 font-label text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        <WarningCircle size={20} weight="bold" />
                        Report no-show
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
            );
          })}

          {baseFiltered.length === 0 ? (
            <div className="text-center py-24 bg-surface rounded-[3rem] border border-divider shadow-elevation-sm">
              <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-6 border border-divider">
                <Receipt size={48} weight="thin" className="text-text-faint" />
              </div>
              <p className="font-display text-2xl font-bold text-text-muted mb-2">No active orders found</p>
              <p className="font-body-md text-text-faint max-w-xs mx-auto">
                {currentView === 'late-pickups'
                  ? 'No late pickups right now. Orders appear here after their pickup window ends.'
                  : 'When customers purchase your rescue bags, they will appear here for verification.'}
              </p>
            </div>
          ) : null}
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
