'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizeOrderStatus, isOrderCollectible } from '@/lib/utils';
import { isCustomerArrivalEligible } from '@/lib/pickupWindow';
import { mapSupabaseError } from '@/lib/supabaseError';
import { mapArrivalError } from '@/lib/messages/rpc';

/**
 * Order detail hook — fetch single order, polling, cancel action, customer arrival.
 */
export function useOrderDetail(orderId) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arrivalBusy, setArrivalBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const fetchOrderDetails = useCallback(async (isSilent = false) => {
    await Promise.resolve();
    try {
      if (!isSilent) setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          bag:rescue_bags(title, image_url, pickup_start, pickup_end),
          shelf:clearance_shelves(id, pickup_start, pickup_end),
          order_items (
            id, name_snapshot, image_url_snapshot, quantity, unit_price, line_total, allergens_snapshot
          ),
          outlet:outlets(name, address, location, merchant:merchants(business_name))
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      setOrder(data);
    } catch (err) {
      setError(mapSupabaseError(err, 'Could not load order details.'));
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    if (!orderId) return undefined;
    let interval;
    const t = window.setTimeout(() => {
      void fetchOrderDetails();
      interval = window.setInterval(() => {
        void fetchOrderDetails(true);
      }, 10000);
    }, 0);
    return () => {
      window.clearTimeout(t);
      if (interval) window.clearInterval(interval);
    };
  }, [fetchOrderDetails, orderId]);

  const shouldPollPayment =
    order?.order_status === 'reserved' && order?.payment_status === 'paid';

  useEffect(() => {
    if (!shouldPollPayment || !orderId) return undefined;
    const fast = window.setInterval(() => {
      void fetchOrderDetails(true);
    }, 5000);
    return () => window.clearInterval(fast);
  }, [shouldPollPayment, orderId, fetchOrderDetails]);

  const handleCancelOrder = useCallback(async () => {
    if (!confirm('Cancel this reservation? This cannot be undone.')) return;

    try {
      setLoading(true);
      const stamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          order_status: 'cancelled',
          cancelled_at: stamp,
          cancelled_by: 'customer',
          cancellation_reason: 'customer_cancelled',
        })
        .eq('id', orderId);

      if (updateError) throw updateError;
      await fetchOrderDetails();
    } catch (err) {
      console.error(err);
      alert('Could not cancel order. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId, supabase, fetchOrderDetails]);

  const signalArrival = useCallback(async () => {
    if (!orderId) return { error: 'Missing order.' };
    setArrivalBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc('customer_signal_arrival', {
        p_order_id: orderId,
      });
      if (rpcError) {
        return {
          error: mapArrivalError(rpcError.message, mapSupabaseError(rpcError)),
        };
      }
      await fetchOrderDetails(true);
      return {};
    } finally {
      setArrivalBusy(false);
    }
  }, [orderId, supabase, fetchOrderDetails]);

  const bag = order?.bag || {};
  const shelf = order?.shelf || {};
  const outlet = order?.outlet || {};
  const orderItems = order?.order_items ?? [];
  const isShelfOrder = Boolean(order?.shelf_id);
  const pickupStart = isShelfOrder ? shelf?.pickup_start : bag?.pickup_start;
  const pickupEnd = isShelfOrder ? shelf?.pickup_end : bag?.pickup_end;
  const normalizedStatus = normalizeOrderStatus(order?.order_status);
  const isReserved = normalizedStatus === 'reserved';
  const collectible = order
    ? isOrderCollectible({
        status: normalizedStatus,
        order_status: order.order_status,
        payment_status: order.payment_status,
      })
    : false;
  const arrivalEligible =
    collectible &&
    !order?.customer_arrived_at &&
    isCustomerArrivalEligible(nowMs, pickupStart, pickupEnd);

  return {
    order,
    bag,
    shelf,
    orderItems,
    isShelfOrder,
    outlet,
    loading,
    error,
    isReserved,
    collectible,
    arrivalEligible,
    arrivalBusy,
    signalArrival,
    handleCancelOrder,
    goBack: () => router.back(),
  };
}
