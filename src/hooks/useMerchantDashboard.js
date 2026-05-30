'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';
import { ACTIVE_ORDER_STATUSES, normalizeOrderStatus } from '@/lib/utils';
import {
  buildOutletModeById,
  orderMatchesOutletListingMode,
} from '@/lib/merchantOrderListingFilter';
import { orderDisplayTitle } from '@/lib/orderDisplay';
import { outletListingMode } from '@/lib/outletListingMode';

export function useMerchantDashboard() {
  const [stats, setStats] = useState({
    active_bags: 0,
    today_orders: 0,
    today_revenue: 0,
    pickup_rate: 100,
    pending_pickups_today: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);
  const { outletScopeIds, outlets, activeOutlet, loading: contextLoading } = useMerchantContext();
  const listingMode = outletListingMode(activeOutlet?.category);
  const activeOutletId = activeOutlet?.id != null ? String(activeOutlet.id) : null;
  const outletModeById = useMemo(() => buildOutletModeById(outlets), [outlets]);

  const filterRowForOutletMode = useCallback(
    (row) => orderMatchesOutletListingMode(row, outletModeById),
    [outletModeById],
  );

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
      const todayDate = today.toISOString().slice(0, 10);

      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('outlet_id', outletScopeIds)
        .gte('created_at', today.toISOString());

      if (ordersError) throw ordersError;

      const rowsToday = (todayOrders || []).filter(filterRowForOutletMode);
      const sales = rowsToday
        .filter((o) => o.payment_status === 'paid' || normalizeOrderStatus(o.order_status) === 'collected')
        .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

      const activeOrderCount = rowsToday.filter((order) =>
        ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(order.order_status)),
      ).length;

      let activeListingsCount = 0;
      const listingOutletIds = activeOutletId ? [activeOutletId] : outletScopeIds;

      if (listingMode === 'clearance_shelf') {
        const { data: todayShelves, error: shelfListError } = await supabase
          .from('clearance_shelves')
          .select('id')
          .in('outlet_id', listingOutletIds)
          .eq('shelf_date', todayDate)
          .eq('status', 'published');
        if (shelfListError) throw shelfListError;
        const shelfIds = (todayShelves ?? []).map((s) => String(s.id));
        if (shelfIds.length > 0) {
          const { count, error: itemCountError } = await supabase
            .from('clearance_shelf_items')
            .select('*', { count: 'exact', head: true })
            .in('shelf_id', shelfIds);
          if (itemCountError) throw itemCountError;
          activeListingsCount = count ?? 0;
        }
      } else if (listingMode === 'hybrid') {
        const { count: bagCount, error: bagsError } = await supabase
          .from('rescue_bags')
          .select('*', { count: 'exact', head: true })
          .in('outlet_id', listingOutletIds)
          .eq('status', 'live');
        if (bagsError) throw bagsError;
        let shelfItemCount = 0;
        const { data: todayShelves, error: shelfListError } = await supabase
          .from('clearance_shelves')
          .select('id')
          .in('outlet_id', listingOutletIds)
          .eq('shelf_date', todayDate)
          .eq('status', 'published');
        if (shelfListError) throw shelfListError;
        const shelfIds = (todayShelves ?? []).map((s) => String(s.id));
        if (shelfIds.length > 0) {
          const { count, error: itemCountError } = await supabase
            .from('clearance_shelf_items')
            .select('*', { count: 'exact', head: true })
            .in('shelf_id', shelfIds);
          if (itemCountError) throw itemCountError;
          shelfItemCount = count ?? 0;
        }
        activeListingsCount = (bagCount ?? 0) + shelfItemCount;
      } else {
        const { count, error: bagsError } = await supabase
          .from('rescue_bags')
          .select('*', { count: 'exact', head: true })
          .in('outlet_id', listingOutletIds)
          .eq('status', 'live');
        if (bagsError) throw bagsError;
        activeListingsCount = count ?? 0;
      }

      const { data: pendingRows, error: pendingError } = await supabase
        .from('orders')
        .select('outlet_id, shelf_id')
        .in('outlet_id', outletScopeIds)
        .in('order_status', ['reserved', 'paid', 'ready_for_pickup'])
        .gte('created_at', today.toISOString());
      if (pendingError) throw pendingError;
      const pendingPickupsCount = (pendingRows ?? []).filter(filterRowForOutletMode).length;

      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select(`
          id, order_status, created_at, shelf_id, outlet_id,
          customer:profiles(full_name),
          bag:rescue_bags(title),
          order_items(name_snapshot, quantity),
          total
        `)
        .in('outlet_id', outletScopeIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentError) throw recentError;

      const formattedRecent = (recent || [])
        .filter(filterRowForOutletMode)
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          customer_name: r.customer?.full_name || 'Customer',
          bag_title: orderDisplayTitle(r),
          time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: normalizeOrderStatus(r.order_status),
          total: r.total,
        }));

      setStats({
        today_revenue: sales,
        active_bags: activeListingsCount,
        today_orders: activeOrderCount,
        pickup_rate: 100,
        pending_pickups_today: pendingPickupsCount,
      });
      setRecentOrders(formattedRecent);
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [
    outletScopeIds,
    supabase,
    listingMode,
    activeOutletId,
    filterRowForOutletMode,
  ]);

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
    refetch: fetchDashboardData,
  };
}
