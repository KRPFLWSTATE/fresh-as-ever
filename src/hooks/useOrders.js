'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Orders list hook — fetches customer orders, splits active/past.
 * Extracted from: src/app/(customer)/orders/page.js
 */
export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view your orders.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id, quantity, total, order_status, created_at,
          bag:rescue_bags(title, image_url, pickup_start, pickup_end),
          outlet:outlets(name, address)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Could not load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const activeOrders = useMemo(
    () => orders.filter(o => o.order_status === 'reserved'),
    [orders]
  );

  const pastOrders = useMemo(
    () => orders.filter(o => o.order_status !== 'reserved'),
    [orders]
  );

  return {
    orders,
    activeOrders,
    pastOrders,
    loading,
    error,
    refetch: fetchOrders,
  };
}
