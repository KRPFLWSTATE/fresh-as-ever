'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';
import { ACTIVE_ORDER_STATUSES, isOrderIdUuidShape, normalizeOrderStatus, isOrderEligibleForMerchantNoShow } from '@/lib/utils';

export function useMerchantOrders() {
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);
  const { outletScopeIds, loading: contextLoading } = useMerchantContext();

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
          total,
          reservation_code,
          customer:profiles(full_name),
          bag:rescue_bags(title, pickup_end)
        `)
        .in('outlet_id', outletScopeIds)
        .in('order_status', [...ACTIVE_ORDER_STATUSES, 'awaiting_pickup'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formatted = (data || []).map((o) => {
        const status = normalizeOrderStatus(o.order_status);
        const pickupEnd = o.bag?.pickup_end ?? null;
        const noShowEligible = isOrderEligibleForMerchantNoShow(status, pickupEnd);
        return {
          id: o.id,
          reservation_code: o.reservation_code,
          status,
          order_status_raw: o.order_status,
          customer_name: o.customer?.full_name || 'Customer',
          bag_title: o.bag?.title || 'Rescue Bag',
          pickup_end: pickupEnd,
          no_show_available: noShowEligible,
          total: o.total,
          created_at: o.created_at,
        };
      });

      setOrders(formatted);
    } catch (err) {
      const serialized = serializeError(err);
      console.error(`Fetch orders error: ${JSON.stringify(serialized)}`);
      setError('Could not load orders right now. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [outletScopeIds, supabase]);

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

      const formatted = (data || []).map(r => {
        const timeDiff = new Date() - new Date(r.updated_at);
        const mins = Math.floor(timeDiff / 60000);
        let timeStr = `${mins} mins ago`;
        if (mins > 60) timeStr = `${Math.floor(mins / 60)} hours ago`;
        if (mins === 0) timeStr = 'Just now';

        return {
          id: r.id.split('-')[0].toUpperCase(),
          time: timeStr,
          customer: r.customer?.full_name || 'Customer',
          status: 'verified'
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

  // Use this function to handle an actual scanned QR code (order ID)
  const verifyOrder = async (orderRef) => {
    try {
      setLoading(true);
      setError(null);
      if (!outletScopeIds?.length) {
        setError('No merchant outlets are linked to this account yet.');
        setScannerActive(false);
        return;
      }

      const isUuid = isOrderIdUuidShape(String(orderRef || ''));
      let query = supabase
        .from('orders')
        .select(`
          id, total, order_status,
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

      if (data) {
        setScanResult({
          id: data.id,
          displayId: data.id.split('-')[0].toUpperCase(),
          customer: data.customer?.full_name || 'Customer',
          items: `1x ${data.bag?.title || 'Bag'}`,
          total: `Rs. ${Number(data.total).toLocaleString()}`,
          status: normalizeOrderStatus(data.order_status),
          pickup_end: data.bag?.pickup_end ?? null,
        });
      }
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
        status: 'reserved'
      });
      setScannerActive(false);
    }, 1500);
  };

  const confirmVerification = async () => {
    if (!scanResult?.id || scanResult.id === 'dummy-id') {
      // Mock confirm for simulated scan
      setScanResult(null);
      return;
    }

    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_status: 'collected', updated_at: new Date().toISOString() })
        .eq('id', scanResult.id)
        .in('order_status', ['ready_for_pickup', 'paid']);

      if (updateError) throw updateError;
      
      setScanResult(null);
      fetchRecentVerifications();
    } catch (err) {
      console.error('Confirm verification error:', err);
      setError('Failed to confirm order.');
    } finally {
      setLoading(false);
    }
  };

  const manualVerifyOrder = async (orderId) => {
    try {
      setError(null);
      setLoading(true);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_status: 'collected', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .in('order_status', ['ready_for_pickup', 'paid']);

      if (updateError) throw updateError;
      
      fetchOrders();
      fetchRecentVerifications();
    } catch (err) {
      console.error('Manual verify error:', err);
      setError('Failed to verify order.');
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
    markNoShow,
    refetch: () => { fetchOrders(); fetchRecentVerifications(); }
  };
}
