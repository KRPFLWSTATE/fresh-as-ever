'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  normalizeOrderStatus,
  isOrderEligibleForMerchantNoShow,
  isOrderCollectible,
  normalizeHandoverCode,
  isOrderIdUuidShape,
} from '@/lib/utils';
import { ArrowLeft, CheckCircle, Clock, Receipt, User, WarningCircle } from '@phosphor-icons/react';

export default function MerchantOrderDetailPage() {
  const resolvedParams = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [handoverCode, setHandoverCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      const rawRef = String(resolvedParams.id || '');
      const isUuid = isOrderIdUuidShape(rawRef);
      let query = supabase
        .from('orders')
        .select(`
            id,
            reservation_code,
            order_status,
            payment_status,
            total,
            created_at,
            customer:profiles(full_name),
            bag:rescue_bags(title, pickup_start, pickup_end),
            outlet:outlets(name)
          `);
      query = isUuid ? query.eq('id', rawRef) : query.eq('reservation_code', rawRef.toUpperCase());
      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setNotFound(true);
        return;
      }
      setOrder(data);
    } catch (fetchErr) {
      setOrder(null);
      setError(fetchErr?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const t = window.setTimeout(() => {
      if (mounted) void loadOrder();
    }, 0);
    return () => {
      mounted = false;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id, supabase]);

  const collectViaRpc = async (code) => {
    if (!order?.id) return;
    setVerifying(true);
    setError(null);
    const normalized = normalizeHandoverCode(code);
    const { data, error: rpcError } = await supabase.rpc('merchant_collect_order', {
      p_order_id: order.id,
      p_code: normalized,
    });
    if (rpcError) {
      let msg = rpcError.message || 'Could not complete handover.';
      if (msg.includes('order_not_ready')) {
        msg = 'This order is not ready for handover yet. Check payment status or pickup window.';
      }
      if (msg.includes('code_mismatch')) {
        msg = 'That code does not match this order.';
      }
      setError(msg);
      setVerifying(false);
      return;
    }
    if (data && typeof data === 'object' && 'ok' in data && !data.ok) {
      setError('Handover was not completed.');
      setVerifying(false);
      return;
    }
    setOrder((prev) => (prev ? { ...prev, order_status: 'collected' } : prev));
    setVerifying(false);
  };

  const authorizeHandover = async () => {
    const code = normalizeHandoverCode(handoverCode);
    if (!code) {
      setError("Enter the 6-character code shown on the customer's order.");
      return;
    }
    if (code !== String(order?.reservation_code || '').toUpperCase()) {
      setError('That code does not match this order.');
      return;
    }
    await collectViaRpc(code);
  };

  const markOrderNoShow = async () => {
    if (!order?.id) return;
    try {
      setMarkingNoShow(true);
      setError(null);
      const { error: rpcError } = await supabase.rpc('mark_order_no_show', { p_order_id: order.id });
      if (rpcError) throw rpcError;
      setOrder((prev) => (prev ? { ...prev, order_status: 'no_show' } : prev));
    } catch (e) {
      setError(e?.message || 'Could not mark order as no-show.');
    } finally {
      setMarkingNoShow(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
        <div className="h-12 w-48 rounded-xl skeleton-shimmer" />
        <div className="h-40 rounded-2xl skeleton-shimmer" />
      </main>
    );
  }

  if (!order) {
    if (error) {
      return (
        <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop">
          <div className="bg-surface rounded-2xl border border-divider p-xl text-center space-y-sm">
            <p className="font-h3 text-h3 text-text">Could not load order</p>
            <p className="font-body-sm text-text-muted">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-label font-bold"
            >
              Retry
            </button>
          </div>
        </main>
      );
    }

    return (
      <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop">
        <div className="bg-surface rounded-2xl border border-divider p-xl text-center">
          <p className="font-h3 text-h3 text-text">{notFound ? 'Order not found' : 'Order unavailable'}</p>
        </div>
      </main>
    );
  }

  const normalized = normalizeOrderStatus(order.order_status);
  const pickupEnd = order.bag?.pickup_end ?? null;
  const collectible = isOrderCollectible({
    status: normalized,
    order_status: order.order_status,
    payment_status: order.payment_status,
  });
  const showNoShowCta = ['paid', 'ready_for_pickup', 'awaiting_pickup'].includes(normalized);
  const noShowEnabled = showNoShowCta && isOrderEligibleForMerchantNoShow(normalized, pickupEnd);
  const alreadyCollected = normalized === 'collected';

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-divider text-primary font-label font-bold"
      >
        <ArrowLeft size={18} weight="bold" />
        Back
      </button>

      <section className="bg-surface rounded-2xl border border-divider p-xl shadow-elevation-sm space-y-md">
        <div className="flex items-center justify-between gap-md">
          <h1 className="font-h2 text-h2 text-text">Order #{order.reservation_code || order.id.slice(0, 8)}</h1>
          <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-divider text-text-muted font-label-caps text-[10px]">
            {normalizeOrderStatus(order.order_status).replaceAll('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="bg-surface-2 rounded-xl p-md border border-divider">
            <p className="font-label-caps text-[10px] text-text-faint">Customer</p>
            <p className="font-label text-text mt-1 inline-flex items-center gap-2">
              <User size={16} weight="bold" />
              {order.customer?.full_name || 'Customer'}
            </p>
          </div>
          <div className="bg-surface-2 rounded-xl p-md border border-divider">
            <p className="font-label-caps text-[10px] text-text-faint">Bag</p>
            <p className="font-label text-text mt-1 inline-flex items-center gap-2">
              <Receipt size={16} weight="bold" />
              {order.bag?.title || 'Rescue Bag'}
            </p>
          </div>
          <div className="bg-surface-2 rounded-xl p-md border border-divider">
            <p className="font-label-caps text-[10px] text-text-faint">Outlet</p>
            <p className="font-label text-text mt-1">{order.outlet?.name || 'Outlet'}</p>
          </div>
          <div className="bg-surface-2 rounded-xl p-md border border-divider">
            <p className="font-label-caps text-[10px] text-text-faint">Total</p>
            <p className="font-price text-price mt-1">Rs. {Number(order.total || 0).toLocaleString()}</p>
          </div>
        </div>

        {!alreadyCollected && collectible ? (
          <div className="bg-primary/5 rounded-xl p-md border border-primary/20 space-y-sm">
            <p className="font-label text-text font-bold">Authorize handover</p>
            <p className="font-body-sm text-text-muted">
              Enter the 6-character code from the customer&apos;s order screen.
            </p>
            <input
              type="text"
              maxLength={6}
              value={handoverCode}
              onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
              placeholder="e.g. B32UYL"
              className="w-full bg-surface border border-divider rounded-xl py-2.5 px-4 font-label tracking-widest uppercase focus:outline-none focus:border-primary"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={authorizeHandover}
                disabled={verifying}
                className="h-11 px-5 rounded-xl bg-primary text-white font-label font-bold disabled:bg-divider disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <CheckCircle size={18} weight="bold" />
                {verifying ? 'Authorizing...' : 'Authorize handover'}
              </button>
              <Link
                href="/merchant/orders?view=verification"
                className="h-11 px-5 rounded-xl border border-divider text-primary font-label font-bold inline-flex items-center"
              >
                Open verification tab
              </Link>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-md pt-sm border-t border-divider">
          {error ? <p className="font-body-sm text-error">{error}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-md">
            <p className="font-body-sm text-text-muted inline-flex items-center gap-2">
              <Clock size={16} weight="bold" />
              {new Date(order.created_at).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              {alreadyCollected ? (
                <span className="h-11 px-5 rounded-xl bg-success/10 text-success font-label font-bold inline-flex items-center gap-2">
                  <CheckCircle size={18} weight="fill" />
                  Collected
                </span>
              ) : null}
              {showNoShowCta ? (
                <span
                  className={noShowEnabled ? 'inline-flex' : 'inline-flex cursor-help'}
                  title={noShowEnabled ? undefined : 'Available 30 minutes after pickup window closes'}
                >
                  <button
                    type="button"
                    onClick={markOrderNoShow}
                    disabled={markingNoShow || !noShowEnabled}
                    aria-label={
                      noShowEnabled
                        ? 'Mark no-show'
                        : 'Mark no-show: Available 30 minutes after pickup window closes'
                    }
                    className="h-11 px-5 rounded-xl border border-divider text-error font-label font-bold disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-2 hover:border-error/30"
                  >
                    <WarningCircle size={18} weight="bold" />
                    {markingNoShow ? 'Updating...' : 'Report no-show'}
                  </button>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
