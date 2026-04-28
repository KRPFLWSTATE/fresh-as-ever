'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Order detail hook — fetch single order, polling, cancel action.
 * Extracted from: src/app/(customer)/orders/[id]/page.js
 */
export function useOrderDetail(orderId) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchOrderDetails = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          bag:rescue_bags(title, image_url, pickup_start, pickup_end),
          outlet:outlets(name, address, location, merchant:merchants(business_name))
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      setOrder(data);
    } catch (err) {
      console.error(err);
      setError('Could not load order details.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderDetails();

    // Poll for status updates every 10s
    const interval = setInterval(() => {
      fetchOrderDetails(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrderDetails, orderId]);

  const handleCancelOrder = useCallback(async () => {
    if (!confirm('Cancel this reservation? This cannot be undone.')) return;

    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_status: 'cancelled' })
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

  // Derived state
  const bag = order?.bag || {};
  const outlet = order?.outlet || {};
  const isReserved = order?.order_status === 'reserved';

  return {
    order,
    bag,
    outlet,
    loading,
    error,
    isReserved,
    handleCancelOrder,
    goBack: () => router.back(),
  };
}
