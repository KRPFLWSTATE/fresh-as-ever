'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizeOrderStatus, isOrderEligibleForMerchantNoShow } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Clock, Receipt, User, WarningCircle } from '@phosphor-icons/react';
import { isOrderIdUuidShape } from '@/lib/utils';

export default function MerchantOrderDetailPage() {
  const resolvedParams = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
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
            total,
            created_at,
            customer:profiles(full_name),
            bag:rescue_bags(title, pickup_end),
            outlet:outlets(name)
          `);
        query = isUuid ? query.eq('id', rawRef) : query.eq('reservation_code', rawRef.toUpperCase());
        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (!data) {
          if (isMounted) setNotFound(true);
          return;
        }
        if (isMounted) setOrder(data);
      } catch (fetchErr) {
        if (isMounted) {
          setOrder(null);
          setError(fetchErr?.message || 'Failed to load order details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, supabase]);

  const verifyOrder = async () => {
    if (!order || order.order_status === 'collected') return;
    try {
      setVerifying(true);
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'collected', updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      setOrder((prev) => (prev ? { ...prev, order_status: 'collected' } : prev));
    } finally {
      setVerifying(false);
    }
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
  const showNoShowCta = ['paid', 'ready_for_pickup', 'awaiting_pickup'].includes(normalized);
  const noShowEnabled = showNoShowCta && isOrderEligibleForMerchantNoShow(normalized, pickupEnd);

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <button
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

        <div className="flex flex-col gap-md pt-sm border-t border-divider">
          {error && (
            <p className="font-body-sm text-error">{error}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-md">
            <p className="font-body-sm text-text-muted inline-flex items-center gap-2">
              <Clock size={16} weight="bold" />
              {new Date(order.created_at).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={verifyOrder}
                disabled={verifying || normalized === 'collected'}
                className="h-11 px-5 rounded-xl bg-primary text-white font-label font-bold disabled:bg-divider disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <CheckCircle size={18} weight="bold" />
                {normalized === 'collected' ? 'Already Collected' : verifying ? 'Verifying...' : 'Mark Collected'}
              </button>
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
                    {markingNoShow ? 'Updating...' : 'Mark No-Show'}
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
