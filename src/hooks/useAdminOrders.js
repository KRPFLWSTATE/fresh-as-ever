'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { adminCollectOrder } from '@/lib/adminCollectOrder';
import { orderDisplayTitle, orderListingKind } from '@/lib/orderDisplay';

export const ADMIN_ORDERS_PAGE_SIZE = 20;

const STATUS_MAP = {
  reserved: ['reserved', 'ready_for_pickup', 'paid', 'awaiting_pickup'],
  collected: ['collected', 'completed'],
  cancelled: ['cancelled'],
};

export function useAdminOrders({
  query = '',
  statusFilter = 'all',
  day = null,
  page = 1,
  sortKey = 'createdAt:desc',
} = {}) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, gross: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const trimmed = query.trim();
      const from = (page - 1) * ADMIN_ORDERS_PAGE_SIZE;
      const to = from + ADMIN_ORDERS_PAGE_SIZE - 1;
      const [sortCol, sortDir] = sortKey.split(':');
      const sortDbCol = sortCol === 'total' ? 'total' : 'created_at';

      let req = supabase
        .from('orders')
        .select(
          `
          id,
          reservation_code,
          order_status,
          payment_status,
          total,
          created_at,
          shelf_id,
          customer:profiles(full_name),
          outlet:outlets(name, merchant:merchants(business_name)),
          bag:rescue_bags(title),
          order_items(name_snapshot, quantity)
        `,
          { count: 'exact' },
        )
        .order(sortDbCol, { ascending: sortDir === 'asc' })
        .range(from, to);

      if (statusFilter !== 'all' && STATUS_MAP[statusFilter]) {
        req = req.in('order_status', STATUS_MAP[statusFilter]);
      }

      if (trimmed) {
        const escaped = trimmed.replace(/[%,]/g, '');
        req = req.or(`reservation_code.ilike.%${escaped}%,id.ilike.%${escaped}%`);
      }

      if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
        const start = new Date(`${day}T00:00:00`);
        if (!Number.isNaN(start.getTime())) {
          const end = new Date(start);
          end.setDate(start.getDate() + 1);
          req = req.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
        }
      }

      const { data, error: fetchError, count } = await req;
      if (fetchError) throw fetchError;

      const formatted = (data || []).map((o) => {
        const listingKind = orderListingKind(o);
        const listingTitle = orderDisplayTitle({
          shelf_id: o.shelf_id,
          bag: o.bag,
          order_items: o.order_items,
        });
        return {
        id: o.id,
        reservation_code: o.reservation_code,
        order_status: o.order_status,
        payment_status: o.payment_status,
        total: o.total,
        created_at: o.created_at,
        listing_kind: listingKind,
        listing_title: listingTitle,
        customer_name: o.customer?.full_name || 'Customer',
        outlet_name: o.outlet?.name || 'Outlet',
        merchant_name: o.outlet?.merchant?.business_name || o.outlet?.name || 'Merchant',
      };
      });

      setRows(formatted);
      setTotalCount(count ?? formatted.length);

      const pending = formatted.filter((r) =>
        ['reserved', 'paid', 'ready_for_pickup', 'awaiting_pickup'].includes(r.order_status),
      ).length;
      const gross = formatted.reduce((sum, r) => sum + Number(r.total || 0), 0);
      setStats({ total: count ?? formatted.length, pending, gross });
    } catch (err) {
      setError(err?.message || 'Could not load orders.');
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [supabase, query, statusFilter, day, page, sortKey]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchOrders();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchOrders]);

  const markCollected = useCallback(
    async (orderId) => {
      setBusyId(orderId);
      const result = await adminCollectOrder(orderId);
      setBusyId(null);
      if (!result.ok) {
        return { error: result.message };
      }
      await fetchOrders();
      return {};
    },
    [fetchOrders],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_ORDERS_PAGE_SIZE));

  return {
    rows,
    totalCount,
    totalPages,
    stats,
    loading,
    error,
    busyId,
    markCollected,
    refetch: fetchOrders,
    pageSize: ADMIN_ORDERS_PAGE_SIZE,
  };
}
