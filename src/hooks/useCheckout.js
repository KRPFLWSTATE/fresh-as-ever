'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';
import { ERROR } from '@/lib/messages/errors';
import { mapCheckoutError } from '@/lib/messages/rpc';

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
export function useCheckout(bagId) {
  const router = useRouter();
  const [bag, setBag] = useState(null);
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

  const cashAllowed = completedPickupCount >= 1;

  const supabase = useMemo(() => createClient(), []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchCheckout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: bagError } = await supabase
        .from('rescue_bags')
        .select(`
          *,
          outlet:outlets (id, name, address, merchant:merchants (business_name))
        `)
        .eq('id', bagId)
        .single();

      if (bagError) throw bagError;

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
  }, [bagId, supabase, router]);

  useEffect(() => {
    if (!bagId) {
      router.push('/discover');
      return undefined;
    }
    const t = window.setTimeout(() => {
      void fetchCheckout();
    }, 0);
    return () => window.clearTimeout(t);
  }, [bagId, fetchCheckout, router]);

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

  const initiatePayHere = useCallback(async (orderId, totalCost, user) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('Session expired. Sign in again.');
      }

      const res = await fetch('/api/payhere/hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: totalCost,
          currency: 'LKR',
        }),
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
        cancel_url: `${window.location.origin}/checkout?bag_id=${bag.id}&payment=cancelled`,
        notify_url: `${window.location.origin}/api/payhere/webhook`,
        order_id: orderId,
        items: bag.title,
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
  }, [bag, supabase, router, showToast]);

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
      if (paymentMethod === 'cash' && !allowedCash) {
        throw new Error('Complete your first pickup to unlock cash at pickup.');
      }

      const code = secureReservationCode(6);
      const totalCost = bag.rescue_price - discount;

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
  }, [appliedPromoId, bag, cashAllowed, discount, paymentMethod, supabase, router, initiatePayHere]);

  const total = bag ? Math.max(0, bag.rescue_price - discount) : 0;

  return {
    bag,
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
