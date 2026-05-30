'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';
import { ERROR } from '@/lib/messages/errors';
import { mapCheckoutError } from '@/lib/messages/rpc';
import { isGroupReservationsEnabled } from '@/lib/groupReservations';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';

function secureReservationCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Checkout hook — bag fetch, promo codes, order creation, PayHere integration.
 * Extracted from: src/app/(customer)/checkout/page.js
 */
export function useCheckout(bagId, groupBagIds = [], shelfCheckout = null) {
  const isShelfCheckout = Boolean(shelfCheckout?.shelfId && shelfCheckout?.items?.length);
  const isGroupCheckout = !isShelfCheckout && groupBagIds.length > 1;
  const router = useRouter();
  const [bag, setBag] = useState(null);
  const [shelf, setShelf] = useState(null);
  const [shelfLineItems, setShelfLineItems] = useState([]);
  const [groupBags, setGroupBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('card');
  /** Count of orders with order_status = collected for current user */
  const [completedPickupCount, setCompletedPickupCount] = useState(0);

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedPromoId, setAppliedPromoId] = useState(null);

  const cashAllowed = completedPickupCount >= 1 && !isGroupCheckout;

  const supabase = useMemo(() => createClient(), []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchCheckout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isShelfCheckout && isClearanceShelvesEnabled()) {
        const { data: shelfRow, error: shelfErr } = await supabase
          .from('clearance_shelves')
          .select(`
            *,
            outlet:outlets (id, name, merchant:merchants (business_name)),
            items:clearance_shelf_items (*)
          `)
          .eq('id', shelfCheckout.shelfId)
          .eq('status', 'published')
          .maybeSingle();
        if (shelfErr) throw shelfErr;
        if (!shelfRow) throw new Error('shelf_not_found');
        const byId = new Map((shelfRow.items ?? []).map((i) => [i.id, i]));
        const lines = [];
        let subtotal = 0;
        for (const row of shelfCheckout.items) {
          const item = byId.get(row.shelf_item_id);
          const qty = Number(row.quantity ?? 0);
          if (!item || qty < 1) {
            throw new Error('clearance_item_sold_out');
          }
          if ((item.quantity_remaining ?? 0) < qty) {
            throw new Error('clearance_item_sold_out');
          }
          const lineTotal = Number(item.rescue_price ?? 0) * qty;
          subtotal += lineTotal;
          lines.push({ ...item, quantity: qty, line_total: lineTotal });
        }
        setShelf(shelfRow);
        setShelfLineItems(lines);
        setBag({
          id: shelfRow.id,
          title: `Clearance shelf · ${lines.length} item${lines.length === 1 ? '' : 's'}`,
          rescue_price: subtotal,
          original_price: subtotal,
          outlet_id: shelfRow.outlet_id,
          outlet: shelfRow.outlet,
          pickup_start: shelfRow.pickup_start,
          pickup_end: shelfRow.pickup_end,
        });
        setGroupBags([]);

        const { data: { user } } = await supabase.auth.getUser();
        let count = 0;
        if (user?.id) {
          const { count: collectedCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', user.id)
            .eq('order_status', 'collected');
          if (typeof collectedCount === 'number') count = collectedCount;
        }
        setCompletedPickupCount(count);
        return;
      }

      const ids = groupBagIds.length ? groupBagIds : bagId ? [bagId] : [];
      const { data: rows, error: bagError } = await supabase
        .from('rescue_bags')
        .select(`
          *,
          outlet:outlets (id, name, address, merchant:merchants (business_name))
        `)
        .in('id', ids);

      if (bagError) throw bagError;
      const list = rows ?? [];
      if (list.length !== ids.length) {
        throw new Error('One or more bags are no longer available.');
      }
      const data = list[0];

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: suspendRow } = await supabase
          .from('profiles')
          .select('is_suspended')
          .eq('id', user.id)
          .maybeSingle();
        if (suspendRow?.is_suspended === true) {
          setBag(null);
          setCompletedPickupCount(0);
          router.replace('/profile?suspended=1');
          return;
        }
      }

      setGroupBags(list);
      setBag(data);

      let count = 0;
      if (user?.id) {
        const { count: collectedCount, error: countError } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .eq('order_status', 'collected');
        if (!countError && typeof collectedCount === 'number') {
          count = collectedCount;
        }
      }
      setCompletedPickupCount(count);
    } catch (err) {
      console.error(err);
      setError(mapSupabaseError(err, ERROR.checkout.loadBag));
    } finally {
      setLoading(false);
    }
  }, [bagId, groupBagIds, isShelfCheckout, shelfCheckout, supabase, router]);

  useEffect(() => {
    if (!bagId && groupBagIds.length === 0 && !isShelfCheckout) {
      router.push('/discover');
      return undefined;
    }
    const t = window.setTimeout(() => {
      void fetchCheckout();
    }, 0);
    return () => window.clearTimeout(t);
  }, [bagId, groupBagIds.length, fetchCheckout, isShelfCheckout, router]);

  useEffect(() => {
    if (cashAllowed || paymentMethod !== 'cash') return undefined;
    const t = window.setTimeout(() => setPaymentMethod('card'), 0);
    return () => window.clearTimeout(t);
  }, [cashAllowed, paymentMethod]);

  const applyPromoCode = useCallback(async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      showToast('Enter a promo code.', 'error');
      return;
    }
    try {
      const { data, error: promoErr } = await supabase
        .from('promo_codes')
        .select('id, code, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();
      if (promoErr) throw promoErr;
      if (!data) {
        showToast('Invalid or expired promo code.', 'error');
        return;
      }
      const now = Date.now();
      if (data.valid_from && new Date(data.valid_from).getTime() > now) {
        showToast('This promo is not active yet.', 'error');
        return;
      }
      if (data.valid_until && new Date(data.valid_until).getTime() < now) {
        showToast('This promo has expired.', 'error');
        return;
      }
      const subtotal = Number(bag?.rescue_price ?? 0);
      if (subtotal < Number(data.min_order_value ?? 0)) {
        showToast(`Minimum order Rs. ${Number(data.min_order_value).toLocaleString()} required.`, 'error');
        return;
      }
      if (data.max_uses != null && Number(data.used_count ?? 0) >= Number(data.max_uses)) {
        showToast('This promo has reached its usage limit.', 'error');
        return;
      }
      let amount = 0;
      if (data.discount_type === 'percent') {
        amount = Math.round((subtotal * Number(data.discount_value ?? 0)) / 100);
      } else {
        amount = Number(data.discount_value ?? 0);
      }
      setDiscount(Math.min(subtotal, amount));
      setAppliedPromoId(data.id);
      showToast('Promotion applied successfully.');
    } catch (err) {
      showToast(err?.message || 'Could not validate promo code.', 'error');
    }
  }, [bag, promoCode, showToast, supabase]);

  const initiatePayHere = useCallback(async (orderId, totalCost, user, options = {}) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('Session expired. Sign in again.');
      }

      const hashBody = options.groupCheckout
        ? { group_id: orderId, amount: totalCost, currency: 'LKR' }
        : { order_id: orderId, amount: totalCost, currency: 'LKR' };

      const res = await fetch('/api/payhere/hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(hashBody),
      });
      const data = await res.json();

      if (!window.payhere) {
        console.warn('PayHere SDK not loaded. Fallback bypass.');
        await supabase.from('orders').update({ payment_status: 'paid', order_status: 'paid' }).eq('id', orderId);
        router.push(`/orders/${orderId}`);
        return;
      }

      const payment = {
        sandbox: true,
        merchant_id: data.merchant_id,
        return_url: `${window.location.origin}/orders/${orderId}?payment=success`,
        cancel_url: options.groupCheckout
          ? `${window.location.origin}/checkout?group=${groupBagIds.join(',')}&payment=cancelled`
          : `${window.location.origin}/checkout?bag_id=${bag.id}&payment=cancelled`,
        notify_url: `${window.location.origin}/api/payhere/webhook`,
        order_id: orderId,
        items: options.groupCheckout
          ? `${options.bagCount ?? groupBagIds.length} rescue bags`
          : bag.title,
        amount: data.amount,
        currency: data.currency,
        hash: data.hash,
        first_name: user?.user_metadata?.full_name?.split(' ')[0] || 'Customer',
        last_name: user?.user_metadata?.full_name?.split(' ')[1] || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: 'Colombo',
        city: 'Colombo',
        country: 'Sri Lanka',
      };

      window.payhere.onCompleted = () => router.push(`/orders/${orderId}`);
      window.payhere.onDismissed = () => {
        setProcessing(false);
        showToast('Payment cancelled.', 'error');
      };
      window.payhere.onError = (err) => {
        setProcessing(false);
        setError(ERROR.checkout.paymentFailed);
      };

      window.payhere.startPayment(payment);
    } catch (err) {
      console.error('Payment initiation failed', err);
      setError(ERROR.checkout.paymentFailed);
      setProcessing(false);
    }
  }, [bag, groupBagIds, supabase, router, showToast]);

  const handleConfirm = useCallback(async () => {
    try {
      setProcessing(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required.');

      let allowedCash = cashAllowed;
      if (!allowedCash) {
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .eq('order_status', 'collected');
        allowedCash = typeof count === 'number' && count >= 1;
      }
      if (isGroupCheckout && paymentMethod === 'cash') {
        throw new Error('Group reservations require card payment.');
      }

      if (paymentMethod === 'cash' && !allowedCash) {
        throw new Error('Complete your first pickup to unlock cash at pickup.');
      }

      const subtotal = isGroupCheckout
        ? groupBags.reduce((sum, row) => sum + Number(row.rescue_price ?? 0), 0)
        : Number(bag.rescue_price ?? 0);
      const totalCost = Math.max(0, subtotal - discount);

      if (isShelfCheckout) {
        if (!isClearanceShelvesEnabled()) {
          throw new Error('Clearance shelves are not available right now.');
        }
        const { data: reserveRows, error: shelfErr } = await supabase.rpc(
          'create_clearance_reservation',
          {
            p_shelf_id: shelfCheckout.shelfId,
            p_items: shelfCheckout.items,
            p_payment_method: paymentMethod,
            p_promo_code: promoCode?.trim() || null,
          },
        );
        if (shelfErr) throw shelfErr;
        const reserveRow = Array.isArray(reserveRows) ? reserveRows[0] : reserveRows;
        const orderId = reserveRow?.order_id;
        if (!orderId) throw new Error('Could not create shelf reservation.');

        if (paymentMethod === 'cash' || totalCost <= 0) {
          await supabase
            .from('orders')
            .update({ payment_status: 'paid', order_status: 'paid' })
            .eq('id', orderId)
            .eq('order_status', 'reserved');
          router.push(`/orders/${orderId}`);
          return;
        }

        await initiatePayHere(orderId, totalCost, user, { shelfCheckout: true });
        return;
      }

      if (isGroupCheckout && !isGroupReservationsEnabled()) {
        throw new Error('Group reservations are not available right now.');
      }

      if (isGroupCheckout) {
        const { data: groupRows, error: groupErr } = await supabase.rpc(
          'create_group_reservation',
          {
            p_bag_ids: groupBagIds,
            p_payment_method: paymentMethod,
            p_promo_code: promoCode?.trim() || null,
          },
        );
        if (groupErr) throw groupErr;
        const groupRow = Array.isArray(groupRows) ? groupRows[0] : groupRows;
        const groupId = groupRow?.group_id;
        if (!groupId) throw new Error('Could not create group reservation.');

        if (paymentMethod === 'cash' || totalCost <= 0) {
          await supabase
            .from('reservation_groups')
            .update({ payment_status: 'paid', order_status: 'paid' })
            .eq('id', groupId);
          await supabase
            .from('orders')
            .update({ payment_status: 'paid', order_status: 'paid' })
            .eq('group_id', groupId);
          const { data: child } = await supabase
            .from('orders')
            .select('id')
            .eq('group_id', groupId)
            .limit(1)
            .maybeSingle();
          router.push(`/orders/${child?.id ?? groupId}`);
          return;
        }

        await initiatePayHere(groupId, totalCost, user, {
          groupCheckout: true,
          bagCount: groupBagIds.length,
        });
        return;
      }

      const code = secureReservationCode(6);

      const orderData = {
        bag_id: bag.id,
        customer_id: user.id,
        outlet_id: bag.outlet_id,
        quantity: 1,
        unit_price: bag.rescue_price,
        subtotal: bag.rescue_price,
        platform_fee: 0,
        total: totalCost,
        payment_method: paymentMethod,
        payment_status: 'pending',
        order_status: 'reserved',
        reservation_code: code,
        discount_amount: discount,
        ...(appliedPromoId ? { promo_code_id: appliedPromoId } : {}),
      };

      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (paymentMethod === 'cash' || totalCost <= 0) {
        await supabase
          .from('orders')
          .update({ payment_status: 'paid', order_status: 'paid' })
          .eq('id', order.id)
          .eq('order_status', 'reserved');
        router.push(`/orders/${order.id}`);
      } else {
        await initiatePayHere(order.id, totalCost, user);
      }
    } catch (err) {
      console.error(err);
      setError(mapCheckoutError(err, ERROR.checkout.reserveFailed));
      setProcessing(false);
    }
  }, [
    appliedPromoId,
    bag,
    cashAllowed,
    discount,
    groupBagIds,
    groupBags,
    isGroupCheckout,
    isShelfCheckout,
    shelfCheckout,
    paymentMethod,
    promoCode,
    supabase,
    router,
    initiatePayHere,
  ]);

  const subtotalDisplay = isGroupCheckout
    ? groupBags.reduce((sum, row) => sum + Number(row.rescue_price ?? 0), 0)
    : Number(bag?.rescue_price ?? 0);
  const total = bag ? Math.max(0, subtotalDisplay - discount) : 0;

  return {
    bag,
    shelf,
    shelfLineItems,
    isShelfCheckout,
    loading,
    processing,
    error,
    toast,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    discount,
    total,
    applyPromoCode,
    handleConfirm,
    cashAllowed,
    completedPickupCount,
  };
}
