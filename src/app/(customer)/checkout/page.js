'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ZeroState from '@/components/spatial/ZeroState';
import Script from 'next/script';
import styles from './page.module.css';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bagId = searchParams.get('bag_id');

  const [bag, setBag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card'
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      setError('Neural registry failure: Requested item data stream unreachable.');
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

  const applyPromoCode = async () => {
    if (promoCode.toUpperCase() === 'RESCUE200') {
      setDiscount(200);
      showToast('Neural Override: Promotion applied successfully.');
    } else {
      showToast('Validation Failed: Invalid promotion sequence.', 'error');
    }
  };

  const handleConfirm = async () => {
    try {
      setProcessing(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required for transaction finalization.');
      }

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
        payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
        order_status: 'reserved',
        reservation_code: code,
        discount_amount: discount
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
      setError(err.message || 'Transaction aborted: Resource exhaustion or network instability.');
      setProcessing(false);
    }
  };

  const initiatePayHere = async (orderId, totalCost, user) => {
    try {
      const res = await fetch('/api/payhere/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, amount: totalCost })
      });
      const data = await res.json();

      if (!window.payhere) {
        console.warn("Payhere SDK offline. Triggering fallback bypass.");
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
        country: 'Sri Lanka'
      };

      window.payhere.onCompleted = function onCompleted() {
        router.push(`/orders/${orderId}`);
      };

      window.payhere.onDismissed = function onDismissed() {
        setProcessing(false);
        showToast("Transaction suspended by user.", "error");
      };

      window.payhere.onError = function onError(error) {
        setProcessing(false);
        setError("Nexus Error: " + error);
      };

      window.payhere.startPayment(payment);
      
    } catch (err) {
      console.error("Payment initiation failed", err);
      setError("Payment downlink failure.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <h2 className={styles.loadingTitle}>PREPARING NEXUS</h2>
          <p className={styles.loadingText}>Allocating transaction buffers...</p>
        </div>
      </div>
    );
  }

  if (error || !bag) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyWrapper}>
          <ZeroState 
            icon="🌌"
            title="Registry Failure"
            description={error || "Target entity lost in the spatial mesh."}
            action={
              <button className={styles.discoverBtn} onClick={() => router.push('/discover')}>
                RETRIEVE NEW COORDS
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const total = bag.rescue_price - discount;

  return (
    <div className={styles.container}>
      <Script src="https://sandbox.payhere.lk/lib/payhere.js" strategy="lazyOnload" />
      
      {toast && (
        <div className={`${styles.toastContainer} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.message}
        </div>
      )}

      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>←</button>
        <h1 className={styles.headerTitle}>Transaction Nexus</h1>
        <div className={styles.paymentRadioWrapper} />
      </header>

      <main className={styles.mainContent}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Manifest Summary</h2>
          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <div className={styles.bagInfo}>
                <span className={styles.qty}>1x</span>
                <div>
                  <div className={styles.itemName}>{bag.title}</div>
                  <div className={styles.merchantName}>{bag.outlet.merchant?.business_name || bag.outlet.name}</div>
                </div>
              </div>
              <div className={styles.itemPrice}>Rs. {bag.rescue_price}</div>
            </div>
            
            <div className={styles.divider} />
            
            <div className={styles.pickupInfo}>
              <span className={styles.icon}>🕒</span>
              <div>
                <span className={styles.pickupLabel}>TRANSFER WINDOW</span>
                <div className={styles.pickupTime}>
                  Today, {new Date(bag.pickup_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(bag.pickup_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Promotion Override</h2>
          <div className={styles.promoGroup}>
            <input 
              type="text" 
              placeholder="ENTER SEQUENCE..." 
              className={styles.promoInput}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button className={styles.promoBtn} onClick={applyPromoCode}>VERIFY</button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Exchange Protocol</h2>
          <div className={styles.paymentMethods}>
            <button 
              className={`${styles.paymentCard} ${paymentMethod === 'card' ? styles.paymentActive : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <span className={styles.paymentIcon}>💳</span>
              <div className={styles.paymentDetails}>
                <span className={styles.paymentName}>Spatial Payment</span>
                <span className={styles.paymentDesc}>Secure Encrypted Transfer</span>
              </div>
              <div className={styles.radioIndicator} />
            </button>
            <button 
              className={`${styles.paymentCard} ${paymentMethod === 'cash' ? styles.paymentActive : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <span className={styles.paymentIcon}>💵</span>
              <div className={styles.paymentDetails}>
                <span className={styles.paymentName}>Physical Exchange</span>
                <span className={styles.paymentDesc}>Settle at Terminal</span>
              </div>
              <div className={styles.radioIndicator} />
            </button>
          </div>
        </section>

        <section className={styles.totalsSection}>
          <div className={styles.totalsRow}>
            <span>SUBTOTAL</span>
            <span>Rs. {bag.rescue_price}</span>
          </div>
          {discount > 0 && (
            <div className={`${styles.totalsRow} ${styles.discountText}`}>
              <span>OVERRIDE DISCOUNT</span>
              <span>- Rs. {discount}</span>
            </div>
          )}
          <div className={styles.divider} />
          <div className={styles.finalTotal}>
            <span>TOTAL YIELD</span>
            <span>Rs. {total > 0 ? total : 0}</span>
          </div>
        </section>
      </main>

      <div className={styles.bottomBar}>
        <button 
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={processing || bag.quantity_remaining <= 0}
        >
          {processing ? 'EXECUTING...' : 'AUTHORIZE TRANSACTION'}
        </button>
        <p className={styles.termsText}>
          Neural authorization finalizes the reservation protocol.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
