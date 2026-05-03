'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';
import { ACTIVE_ORDER_STATUSES, normalizeOrderStatus } from '@/lib/utils';

export function useMerchantDashboard() {
  const [stats, setStats] = useState({
    active_bags: 0,
    today_orders: 0,
    today_revenue: 0,
    pickup_rate: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);
  const { outletScopeIds, loading: contextLoading } = useMerchantContext();

  const fetchDashboardData = useCallback(async () => {
    await Promise.resolve();
    if (!outletScopeIds?.length) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's orders from the same outlet scope used in merchant orders.
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('outlet_id', outletScopeIds)
        .gte('created_at', today.toISOString());

      if (ordersError) throw ordersError;

      const sales = todayOrders
        .filter(o => o.payment_status === 'paid' || o.order_status === 'collected')
        .reduce((sum, o) => sum + Number(o.total), 0);
        
      const activeOrderCount = (todayOrders || []).filter((order) => ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(order.order_status))).length;

      // Fetch active bags
      const { count: activeBagsCount, error: bagsError } = await supabase
        .from('rescue_bags')
        .select('*', { count: 'exact', head: true })
        .in('outlet_id', outletScopeIds)
        .eq('status', 'live');

      if (bagsError) throw bagsError;

      // Fetch recent orders feed
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select(`
          id, order_status, created_at,
          customer:profiles(full_name),
          bag:rescue_bags(title)
        `)
        .in('outlet_id', outletScopeIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const formattedRecent = (recent || []).map(r => ({
        id: r.id,
        customer_name: r.customer?.full_name || 'Customer',
        bag_title: r.bag?.title || 'Bag',
        time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: normalizeOrderStatus(r.order_status),
        total: r.total
      }));

      setStats({
        today_revenue: sales,
        active_bags: activeBagsCount || 0,
        today_orders: activeOrderCount,
        pickup_rate: 100 // placeholder
      });
      setRecentOrders(formattedRecent);

    } catch (err) {
      console.error('Fetch dashboard error:', err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [outletScopeIds, supabase]);

  useEffect(() => {
    if (contextLoading) return undefined;
    const t = window.setTimeout(() => {
      void fetchDashboardData();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchDashboardData, contextLoading]);

  return {
    stats,
    recentOrders,
    loading: loading || contextLoading,
    error,
    refetch: fetchDashboardData
  };
}
