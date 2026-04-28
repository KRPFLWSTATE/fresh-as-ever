'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchBagDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rescue_bags')
        .select(`
          *,
          outlet:outlets (id, name, address, merchant:merchants (business_name))
        `)
        .eq('id', bagId)
        .single();

      if (error) throw error;
      setBag(data);
    } catch (err) {
      console.error(err);
      setError('Could not load bag details.');
    } finally {
      setLoading(false);
    }
  }, [bagId, supabase]);

  useEffect(() => {
    if (!bagId) {
      router.push('/discover');
      return;
    }
    fetchBagDetails();
  }, [bagId, fetchBagDetails, router]);

  const applyPromoCode = useCallback(async () => {
    if (promoCode.toUpperCase() === 'RESCUE200') {
      setDiscount(200);
      showToast('Promotion applied successfully.');
    } else {
      showToast('Invalid promo code.', 'error');
    }
  }, [promoCode, showToast]);

  const initiatePayHere = useCallback(async (orderId, totalCost, user) => {
    try {
      const res = await fetch('/api/payhere/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, amount: totalCost }),
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
        setError('Payment error: ' + err);
      };

      window.payhere.startPayment(payment);
    } catch (err) {
      console.error('Payment initiation failed', err);
      setError('Payment initiation failed.');
      setProcessing(false);
    }
  }, [bag, supabase, router, showToast]);

  const handleConfirm = useCallback(async () => {
    try {
      setProcessing(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required.');

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
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
      };

      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (paymentMethod === 'cash' || totalCost <= 0) {
        router.push(`/orders/${order.id}`);
      } else {
        await initiatePayHere(order.id, totalCost, user);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not complete reservation.');
      setProcessing(false);
    }
  }, [bag, discount, paymentMethod, supabase, router, initiatePayHere]);

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
  };
}
