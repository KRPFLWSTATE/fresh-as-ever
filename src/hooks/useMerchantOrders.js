'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';
import { mapHandoverError } from '@/lib/messages/rpc';
import { ERROR } from '@/lib/messages/errors';
import { useMerchantContext } from './useMerchantContext';
import {
  ACTIVE_ORDER_STATUSES,
  isOrderIdUuidShape,
  normalizeOrderStatus,
  isOrderEligibleForMerchantNoShow,
  isOrderCollectible,
  normalizeHandoverCode,
} from '@/lib/utils';
import {
  buildOutletModeById,
  orderMatchesOutletListingMode,
} from '@/lib/merchantOrderListingFilter';
import { orderDisplayTitle, orderPickupWindow } from '@/lib/orderDisplay';

export function useMerchantOrders() {
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);
  const { outletScopeIds, outlets, loading: contextLoading } = useMerchantContext();
  const outletModeById = useMemo(() => buildOutletModeById(outlets), [outlets]);

  const serializeError = (err) => {
    if (!err) return null;
    return {
      message: err.message || 'Unknown error',
      code: err.code || null,
      details: err.details || null,
      hint: err.hint || null,
    };
  };

  const fetchOrders = useCallback(async () => {
    await Promise.resolve();
    if (!outletScopeIds?.length) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          order_status,
          payment_status,
          customer_arrived_at,
          total,
          reservation_code,
          outlet_id,
          shelf_id,
          customer:profiles(full_name),
          order_items(name_snapshot, quantity),
          shelf:clearance_shelves(pickup_start, pickup_end),
          bag:rescue_bags(title, pickup_start, pickup_end)
        `)
        .in('outlet_id', outletScopeIds)
        .in('order_status', [...ACTIVE_ORDER_STATUSES, 'awaiting_pickup'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formatted = (data || []).map((o) => {
        const status = normalizeOrderStatus(o.order_status);
        const pickup = orderPickupWindow(o);
        const pickupEnd = pickup.end;
        const pickupStart = pickup.start;
        const noShowEligible = isOrderEligibleForMerchantNoShow(status, pickupEnd);
        return {
          id: o.id,
          outlet_id: String(o.outlet_id ?? ''),
          reservation_code: o.reservation_code,
          status,
          order_status_raw: o.order_status,
          payment_status: o.payment_status ?? null,
          customer_arrived_at: o.customer_arrived_at ?? null,
          customer_name: o.customer?.full_name || 'Customer',
          bag_title: orderDisplayTitle(o),
          shelf_id: o.shelf_id ?? null,
          pickup_start: pickupStart,
          pickup_end: pickupEnd,
          no_show_available: noShowEligible,
          total: o.total,
          created_at: o.created_at,
        };
      });

      setOrders(
        formatted.filter((order) => orderMatchesOutletListingMode(order, outletModeById)),
      );
    } catch (err) {
      const serialized = serializeError(err);
      console.error(`Fetch orders error: ${JSON.stringify(serialized)}`);
      setError(mapSupabaseError(err, 'Could not load orders right now. Please retry.'));
    } finally {
      setLoading(false);
    }
  }, [outletScopeIds, supabase, outletModeById]);

  const fetchRecentVerifications = useCallback(async () => {
    await Promise.resolve();
    if (!outletScopeIds?.length) {
      setRecentVerifications([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id, updated_at, order_status,
          customer:profiles(full_name),
          bag:rescue_bags(title)
        `)
        .in('outlet_id', outletScopeIds)
        .eq('order_status', 'collected')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (fetchError) throw fetchError;

      const formatted = (data || []).map((r) => {
        const timeDiff = new Date() - new Date(r.updated_at);
        const mins = Math.floor(timeDiff / 60000);
        let timeStr = `${mins} mins ago`;
        if (mins > 60) timeStr = `${Math.floor(mins / 60)} hours ago`;
        if (mins === 0) timeStr = 'Just now';

        return {
          id: r.id.split('-')[0].toUpperCase(),
          time: timeStr,
          customer: r.customer?.full_name || 'Customer',
          status: 'verified',
        };
      });

      setRecentVerifications(formatted);
    } catch (err) {
      console.error(`Fetch verifications error: ${JSON.stringify(serializeError(err))}`);
    }
  }, [outletScopeIds, supabase]);

  useEffect(() => {
    if (contextLoading) return undefined;
    const t = window.setTimeout(() => {
      void fetchOrders();
      void fetchRecentVerifications();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchOrders, fetchRecentVerifications, contextLoading]);

  const collectOrder = useCallback(
    async (orderId, code) => {
      const { data: orderMeta } = await supabase
        .from('orders')
        .select('shelf_id')
        .eq('id', orderId)
        .maybeSingle();
      const rpcName = orderMeta?.shelf_id
        ? 'merchant_collect_clearance_order'
        : 'merchant_collect_order';
      const { data, error: rpcError } = await supabase.rpc(rpcName, {
        p_order_id: orderId,
        p_code: code?.trim() ? code.replace(/\s/g, '').toUpperCase() : null,
      });

      if (rpcError) {
        return { error: mapHandoverError(rpcError.message, ERROR.handover.failed) };
      }
      if (data && typeof data === 'object' && 'ok' in data && !data.ok) {
        return { error: 'Handover was not completed.' };
      }
      await fetchOrders();
      await fetchRecentVerifications();
      return {};
    },
    [supabase, fetchOrders, fetchRecentVerifications],
  );

  const collectGroupHandover = useCallback(
    async (groupId, code) => {
      const { error: rpcError } = await supabase.rpc('merchant_collect_group', {
        p_group_id: groupId,
        p_code: code?.trim() ? code.replace(/\s/g, '').toUpperCase() : null,
      });
      if (rpcError) {
        return {
          error: mapSupabaseError(rpcError, 'Could not complete group handover.'),
        };
      }
      await fetchOrders();
      await fetchRecentVerifications();
      return {};
    },
    [supabase, fetchOrders, fetchRecentVerifications],
  );

  const lookupHandoverByCode = useCallback(
    async (rawCode) => {
      const code = normalizeHandoverCode(rawCode);
      if (!code) {
        return { error: ERROR.handover.codeLength };
      }
      if (!outletScopeIds?.length) {
        return { error: 'No outlet selected.' };
      }

      const { data: group, error: groupLookupError } = await supabase
        .from('reservation_groups')
        .select('id, order_status, payment_status, outlet_id, bag_count, reservation_code')
        .eq('reservation_code', code)
        .maybeSingle();

      if (groupLookupError) {
        return { error: mapSupabaseError(groupLookupError, ERROR.common.notFound) };
      }

      if (group?.id) {
        if (!outletScopeIds.includes(String(group.outlet_id))) {
          return { error: 'This pickup is not for your outlets.' };
        }
        const { data: childOrders, error: childErr } = await supabase
          .from('orders')
          .select('id, bag:rescue_bags(title), customer:profiles(full_name)')
          .eq('group_id', group.id)
          .order('created_at', { ascending: true });
        if (childErr) {
          return { error: mapSupabaseError(childErr, ERROR.common.notFound) };
        }
        const bags = (childOrders || []).map((row) => ({
          id: row.id,
          title: row.bag?.title || 'Bag',
        }));
        const customerName =
          childOrders?.[0]?.customer?.full_name || 'Customer';
        return {
          type: 'group',
          groupId: group.id,
          code,
          bagCount: group.bag_count ?? bags.length,
          bags,
          customerName,
        };
      }

      const { data, error: lookupError } = await supabase
        .from('orders')
        .select(`
          id, order_status, payment_status, outlet_id, group_id, shelf_id, reservation_code,
          bag:rescue_bags(title),
          customer:profiles(full_name)
        `)
        .eq('reservation_code', code)
        .maybeSingle();

      if (lookupError) {
        return { error: mapSupabaseError(lookupError, ERROR.common.notFound) };
      }
      if (!data?.id) {
        return { error: 'No order found for this code.' };
      }
      if (!outletScopeIds.includes(String(data.outlet_id))) {
        return { error: 'This pickup is not for your outlets.' };
      }

      if (data.shelf_id) {
        const { data: lineItems, error: itemsErr } = await supabase
          .from('order_items')
          .select('id, name_snapshot, image_url_snapshot, quantity, line_total')
          .eq('order_id', data.id)
          .order('created_at', { ascending: true });
        if (itemsErr) {
          return { error: mapSupabaseError(itemsErr, ERROR.common.notFound) };
        }
        const row = {
          status: normalizeOrderStatus(data.order_status),
          order_status_raw: data.order_status,
          payment_status: data.payment_status ?? null,
        };
        if (!isOrderCollectible(row)) {
          return { error: ERROR.handover.notReady };
        }
        return {
          type: 'clearance',
          orderId: data.id,
          code,
          items: lineItems ?? [],
          customerName: data.customer?.full_name || 'Customer',
        };
      }

      if (data.group_id) {
        const { data: childOrders, error: childErr } = await supabase
          .from('orders')
          .select('id, bag:rescue_bags(title), customer:profiles(full_name)')
          .eq('group_id', data.group_id)
          .order('created_at', { ascending: true });
        if (childErr) {
          return { error: mapSupabaseError(childErr, ERROR.common.notFound) };
        }
        const bags = (childOrders || []).map((row) => ({
          id: row.id,
          title: row.bag?.title || 'Bag',
        }));
        return {
          type: 'group',
          groupId: data.group_id,
          code,
          bagCount: bags.length,
          bags,
          customerName: data.customer?.full_name || 'Customer',
        };
      }

      const row = {
        status: normalizeOrderStatus(data.order_status),
        order_status_raw: data.order_status,
        payment_status: data.payment_status ?? null,
      };
      if (!isOrderCollectible(row)) {
        return { error: ERROR.handover.notReady };
      }

      return {
        type: 'order',
        orderId: data.id,
        code,
        bagTitle: data.bag?.title || 'Bag',
        customerName: data.customer?.full_name || 'Customer',
      };
    },
    [outletScopeIds, supabase],
  );

  const manualVerifyOrder = useCallback(
    async (orderId) => {
      try {
        setError(null);
        setLoading(true);
        const result = await collectOrder(orderId, null);
        if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        console.error('Manual verify error:', err);
        setError('Failed to verify order.');
      } finally {
        setLoading(false);
      }
    },
    [collectOrder],
  );

  const authorizeHandoverByCode = useCallback(
    async (rawCode) => {
      const code = normalizeHandoverCode(rawCode);
      if (!code) {
        return { error: ERROR.handover.codeLength };
      }
      if (!outletScopeIds?.length) {
        return { error: 'No outlet selected.' };
      }

      const { data: group, error: groupLookupError } = await supabase
        .from('reservation_groups')
        .select('id, order_status, payment_status, outlet_id, bag_count')
        .eq('reservation_code', code)
        .maybeSingle();

      if (groupLookupError) {
        return { error: mapSupabaseError(groupLookupError, ERROR.common.notFound) };
      }

      if (group?.id) {
        if (!outletScopeIds.includes(String(group.outlet_id))) {
          return { error: 'This pickup is not for your outlets.' };
        }
        return collectGroupHandover(group.id, code);
      }

      const { data, error: lookupError } = await supabase
        .from('orders')
        .select('id, order_status, payment_status, outlet_id, group_id')
        .eq('reservation_code', code)
        .maybeSingle();

      if (lookupError) {
        return { error: mapSupabaseError(lookupError, ERROR.common.notFound) };
      }
      if (!data?.id) {
        return { error: 'No order found for this code.' };
      }
      if (!outletScopeIds.includes(String(data.outlet_id))) {
        return { error: 'This pickup is not for your outlets.' };
      }

      if (data.group_id) {
        return collectGroupHandover(data.group_id, code);
      }

      const row = {
        status: normalizeOrderStatus(data.order_status),
        order_status_raw: data.order_status,
        payment_status: data.payment_status ?? null,
      };
      if (!isOrderCollectible(row)) {
        return { error: ERROR.handover.notReady };
      }

      return collectOrder(data.id, code);
    },
    [outletScopeIds, supabase, collectOrder, collectGroupHandover],
  );

  const verifyOrder = async (orderRef) => {
    try {
      setLoading(true);
      setError(null);
      if (!outletScopeIds?.length) {
        setError('No merchant outlets are linked to this account yet.');
        setScannerActive(false);
        return;
      }

      const ref = String(orderRef || '').trim();
      const isUuid = isOrderIdUuidShape(ref);

      if (!isUuid) {
        const code = normalizeHandoverCode(ref);
        if (code) {
          const lookup = await lookupHandoverByCode(code);
          if (lookup.error) {
            setError(lookup.error);
            setScannerActive(false);
            return;
          }
          if (lookup.type === 'group') {
            setScanResult({
              id: lookup.groupId,
              isGroup: true,
              groupId: lookup.groupId,
              displayId: code,
              customer: lookup.customerName || 'Customer',
              items: lookup.bags.map((b) => b.title).join(', '),
              bags: lookup.bags,
              bagCount: lookup.bagCount ?? lookup.bags.length,
              total: `${lookup.bags.length} bag${lookup.bags.length === 1 ? '' : 's'}`,
              status: 'reserved',
              code,
            });
            setScannerActive(false);
            return;
          }
          if (lookup.type === 'order') {
            const { data: orderRow, error: orderErr } = await supabase
              .from('orders')
              .select(`
                id, total, order_status, payment_status,
                customer:profiles(full_name),
                bag:rescue_bags(title, pickup_end)
              `)
              .eq('id', lookup.orderId)
              .maybeSingle();
            if (orderErr || !orderRow) {
              setError('Order reference was not found for your outlets.');
              setScannerActive(false);
              return;
            }
            setScanResult({
              id: orderRow.id,
              displayId: code,
              customer: orderRow.customer?.full_name || 'Customer',
              items: `1x ${orderRow.bag?.title || 'Bag'}`,
              total: `Rs. ${Number(orderRow.total).toLocaleString()}`,
              status: normalizeOrderStatus(orderRow.order_status),
              payment_status: orderRow.payment_status ?? null,
              pickup_end: orderRow.bag?.pickup_end ?? null,
              code,
            });
            setScannerActive(false);
            return;
          }
        }
      }

      let query = supabase
        .from('orders')
        .select(`
          id, total, order_status, payment_status,
          customer:profiles(full_name),
          bag:rescue_bags(title, pickup_end)
        `)
        .in('outlet_id', outletScopeIds);

      query = isUuid ? query.eq('id', orderRef) : query.eq('reservation_code', String(orderRef || '').toUpperCase());

      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Order reference was not found for your outlets.');
        setScannerActive(false);
        return;
      }

      setScanResult({
        id: data.id,
        displayId: data.id.split('-')[0].toUpperCase(),
        customer: data.customer?.full_name || 'Customer',
        items: `1x ${data.bag?.title || 'Bag'}`,
        total: `Rs. ${Number(data.total).toLocaleString()}`,
        status: normalizeOrderStatus(data.order_status),
        payment_status: data.payment_status ?? null,
        pickup_end: data.bag?.pickup_end ?? null,
      });
      setScannerActive(false);
    } catch (err) {
      console.error(`Verify order error: ${JSON.stringify(serializeError(err))}`);
      setError('Could not verify this order reference.');
    } finally {
      setLoading(false);
    }
  };

  const simulateScan = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScanResult({
        id: 'dummy-id',
        displayId: 'ORD-8924',
        customer: 'Michael T.',
        items: '2x Surprise Bag',
        total: 'Rs. 1,600',
        status: 'reserved',
      });
      setScannerActive(false);
    }, 1500);
  };

  const confirmVerification = async () => {
    if (!scanResult?.id || scanResult.id === 'dummy-id') {
      setScanResult(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (scanResult.isGroup && scanResult.groupId) {
        const result = await collectGroupHandover(
          scanResult.groupId,
          scanResult.code ?? null,
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        setScanResult(null);
        return;
      }
      const result = await collectOrder(scanResult.id, scanResult.code ?? null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setScanResult(null);
    } catch (err) {
      console.error('Confirm verification error:', err);
      setError('Failed to confirm order.');
    } finally {
      setLoading(false);
    }
  };

  const markNoShow = async (orderId) => {
    try {
      setError(null);
      setLoading(true);
      const { error: rpcError } = await supabase.rpc('mark_order_no_show', { p_order_id: orderId });

      if (rpcError) {
        throw rpcError;
      }
      fetchOrders();
      fetchRecentVerifications();
      setScanResult(null);
    } catch (err) {
      console.error('Mark no-show error:', err);
      const msg =
        err?.message ||
        err?.details ||
        (typeof err === 'object' && err?.hint) ||
        'Could not mark this order as no-show.';
      setError(msg.includes('grace') ? 'Available 30 minutes after pickup window closes.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    scannerActive,
    setScannerActive,
    scanResult,
    setScanResult,
    recentVerifications,
    orders,
    loading: loading || contextLoading,
    error,
    simulateScan,
    verifyOrder,
    confirmVerification,
    manualVerifyOrder,
    authorizeHandoverByCode,
    lookupHandoverByCode,
    collectGroupHandover,
    collectOrder,
    markNoShow,
    refetch: () => {
      fetchOrders();
      fetchRecentVerifications();
    },
  };
}
