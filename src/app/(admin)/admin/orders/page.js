'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Receipt,
  Storefront,
  User,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { normalizeOrderStatus } from '@/lib/utils';

function PlatformOrdersContent() {
  const searchParams = useSearchParams();
  const day = searchParams?.get('day') || null;
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');

  const {
    rows,
    totalCount,
    totalPages,
    stats,
    loading,
    error,
    busyId,
    markCollected,
    pageSize,
  } = useAdminOrders({ query, statusFilter, day, page });

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalCount, page * pageSize);

  const handleMarkCollected = async (orderId) => {
    if (!confirm('Mark this order as collected? This uses the admin handover RPC.')) return;
    setNotice('');
    const result = await markCollected(orderId);
    if (result?.error) {
      setNotice(result.error);
    } else {
      setNotice('Order marked as collected.');
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
            Operations
          </p>
          <h1 className="font-display text-h1 text-text">All Orders</h1>
          {day ? (
            <p className="font-body-sm text-text-muted mt-1">
              Filtered to {day}.{' '}
              <Link href="/admin/orders" className="text-primary font-bold">
                Clear date filter
              </Link>
            </p>
          ) : null}
        </div>
        <div className="relative w-full md:w-80 group">
          <MagnifyingGlass
            size={20}
            weight="bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Search order id or reservation code..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface border border-divider rounded-2xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md shadow-elevation-sm"
          />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface rounded-2xl border border-divider p-md">
          <p className="font-label-caps text-[10px] text-text-faint uppercase">Total (page scope)</p>
          <p className="font-display text-3xl font-black text-text mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-divider p-md">
          <p className="font-label-caps text-[10px] text-text-faint uppercase">Pending on page</p>
          <p className="font-display text-3xl font-black text-text mt-1">{stats.pending}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-divider p-md">
          <p className="font-label-caps text-[10px] text-text-faint uppercase">Gross on page</p>
          <p className="font-display text-3xl font-black text-text mt-1">
            Rs. {Number(stats.gross || 0).toLocaleString()}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          ['all', 'All'],
          ['reserved', 'Reserved'],
          ['collected', 'Collected'],
          ['cancelled', 'Cancelled'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setStatusFilter(key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full font-label text-sm font-bold border ${
              statusFilter === key
                ? 'bg-primary text-white border-primary'
                : 'bg-surface border-divider text-text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-error font-body-sm">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-divider bg-surface-2 px-4 py-3 font-body-sm text-text-muted">
          {notice}
        </div>
      ) : null}

      <div className="bg-surface rounded-[2rem] border border-divider shadow-elevation-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-7 gap-md p-6 bg-surface-2 border-b border-divider font-label text-xs font-bold text-text-muted uppercase tracking-widest">
          <span>Order</span>
          <span>Bag / Merchant</span>
          <span>Customer</span>
          <span>Status</span>
          <span className="text-right">Total</span>
          <span className="text-right">Created</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="p-8 text-center font-body-sm text-text-muted">Loading orders...</div>
        ) : null}

        {!loading && rows.length === 0 ? (
          <div className="p-8 text-center font-body-sm text-text-muted">No orders match your filters.</div>
        ) : null}

        <div className="divide-y divide-divider">
          {!loading &&
            rows.map((o) => {
              const st = normalizeOrderStatus(o.order_status);
              const isCollected = st === 'collected';
              return (
                <div
                  key={o.id}
                  className="grid grid-cols-2 md:grid-cols-7 gap-md p-6 items-center hover:bg-surface-2 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <Receipt size={20} weight="bold" className="text-primary/40" />
                    <span className="font-label text-sm font-bold text-primary">
                      #{o.reservation_code || o.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="hidden md:flex flex-col text-text-muted">
                    <span className="font-body-sm text-sm inline-flex items-center gap-2">
                      <Storefront size={16} weight="bold" />
                      {o.merchant_name}
                    </span>
                    <span className="font-body-sm text-xs text-text-faint">{o.outlet_name}</span>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-text-muted">
                    <User size={18} weight="bold" className="text-text-faint" />
                    <span className="font-body-sm text-sm">{o.customer_name}</span>
                  </div>

                  <div className="flex items-center">
                    {st === 'ready_for_pickup' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-success/10 text-success border border-success/20">
                        <CheckCircle size={14} weight="fill" />
                        Ready
                      </span>
                    ) : st === 'paid' || st === 'reserved' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-surface-2 text-text-muted border border-divider">
                        <Clock size={14} weight="bold" />
                        {st.replaceAll('_', ' ')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                        {st.replaceAll('_', ' ')}
                      </span>
                    )}
                  </div>

                  <span className="font-price text-price md:text-right">{o.total ? `Rs. ${Number(o.total).toLocaleString()}` : '—'}</span>

                  <span className="hidden md:block font-body-sm text-text-muted text-right">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                  </span>

                  <div className="md:text-right">
                    <button
                      type="button"
                      disabled={isCollected || busyId === o.id}
                      onClick={() => handleMarkCollected(o.id)}
                      className="h-9 px-3 rounded-lg bg-primary text-white text-xs font-bold disabled:bg-divider disabled:cursor-not-allowed"
                    >
                      {busyId === o.id ? 'Updating...' : isCollected ? 'Collected' : 'Mark collected'}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-md">
        <p className="font-body-sm text-text-muted">
          Showing {rangeStart}–{rangeEnd} of {totalCount}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-10 w-10 rounded-xl border border-divider flex items-center justify-center disabled:opacity-40"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <span className="font-label text-sm self-center">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-10 w-10 rounded-xl border border-divider flex items-center justify-center disabled:opacity-40"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PlatformOrdersPage() {
  return (
    <Suspense fallback={<main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop" />}>
      <PlatformOrdersContent />
    </Suspense>
  );
}
