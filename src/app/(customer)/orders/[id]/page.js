'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function OrderDetailPage({ params }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchOrderDetails = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          bag:rescue_bags(title, image_url, pickup_start, pickup_end),
          outlet:outlets(name, address, location, merchant:merchants(business_name))
        `)
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;
      setOrder(data);
    } catch (err) {
      console.error(err);
      setError('Neural downlink failed: Transaction record unreachable.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchOrderDetails();
    
    // Kinetic State Sync: Real-time status polling
    const interval = setInterval(() => {
      fetchOrderDetails(true);
    }, 10000); // 10s sync window
    
    return () => clearInterval(interval);
  }, [fetchOrderDetails]);

  const handleCancelOrder = async () => {
    // In a premium app, this would be a high-fidelity modal, 
    // but for restoration, we ensure it's at least functional and not native alert.
    if (!confirm("Neural Protocol: Do you wish to abort this reservation? This cannot be undone.")) return;
    
    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_status: 'cancelled' })
        .eq('id', params.id);
        
      if (updateError) throw updateError;
      await fetchOrderDetails();
    } catch (err) {
      console.error(err);
      alert("Abort sequence failed. Transmission error.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <h2 className={styles.loadingTitle}>SYNCING TRANSACTION</h2>
          <p className={styles.loadingText}>Calibrating spatial coordinates...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>← BACK</button>
        </header>
        <div className={styles.errorState}>
          <h2 className={styles.errorTitle}>LOST DATA STREAM</h2>
          <p className={styles.errorText}>{error || "Order signature not found in spatial registry."}</p>
          <button className={styles.btnPrimary} onClick={() => router.push('/discover')}>RETRIEVE NEW ASSETS</button>
        </div>
      </div>
    );
  }

  const bag = order.bag || {};
  const outlet = order.outlet || {};
  const isReserved = order.order_status === 'reserved';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>← TRANSACTION BACKLOG</button>
      </header>

      <main className={styles.mainContent}>
        {/* Refractive Status Banner */}
        <div className={styles.statusBanner} data-status={order.order_status}>
          {order.order_status === 'reserved' && 'ENTITY READY FOR TRANSFER'}
          {order.order_status === 'completed' && 'RESCUE COMPLETE'}
          {order.order_status === 'cancelled' && 'PROTOCOL TERMINATED'}
        </div>

        {/* Holographic Ticket Card */}
        {order.order_status === 'reserved' && (
          <div className={styles.ticketCard}>
             <h2 className={styles.ticketTitle}>PRESENT AT TERMINAL</h2>
             
             <div className={styles.qrPlaceholder}>
               <div className={styles.qrInner}>
                 <span className={styles.qrIcon}>🔳</span>
               </div>
             </div>
             
             <div className={styles.codeText}>RESERVATION KEY</div>
             <div className={styles.reservationCode}>
               {order.reservation_code}
             </div>

             {order.payment_status === 'pending' && order.payment_method === 'cash' && (
               <div className={styles.paymentWarning}>
                 PENDING SETTLEMENT: Rs. {order.total} (PHYSICAL CURRENCY)
               </div>
             )}
          </div>
        )}

        {/* Operational Blueprint (Summary) */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>ASSET MANIFEST</h3>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <img 
                src={bag.image_url || '/placeholder-bag.png'} 
                className={styles.bagImage}
                alt={bag.title}
              />
              <div className={styles.bagInfo}>
                <div className={styles.itemName}>{bag.title}</div>
                <div className={styles.merchantName}>{outlet.merchant?.business_name || outlet.name}</div>
              </div>
            </div>
            
            <div className={styles.divider} />
            
            <div className={styles.pickupInfo}>
              <span className={styles.icon}>🕒</span>
              <div>
                <span className={styles.pickupLabel}>TRANSFER WINDOW</span>
                <div className={styles.pickupValue}>
                  {new Date(bag.pickup_start).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} <br/>
                  {new Date(bag.pickup_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(bag.pickup_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>

            <div className={styles.pickupInfo}>
              <span className={styles.icon}>📍</span>
              <div>
                <span className={styles.pickupLabel}>COORDINATES</span>
                <div className={styles.pickupValue}>
                  {outlet.name} <br/>
                  <span className={styles.address}>{outlet.address}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pulse Receipt */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>LEDGER DETAILS</h3>
          <div className={styles.receiptCard}>
            <div className={styles.receiptRow}>
               <span>TIMESTAMP</span>
               <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
<div className={styles.receiptRow}>
               <span>SIGNATURE</span>
               <span className={styles.orderId}>{order.id}</span>
             </div>
             <div className={styles.receiptRow}>
               <span>EXCHANGE PROTOCOL</span>
               <span className={styles.paymentMethod}>{order.payment_method}</span>
             </div>
            <div className={styles.divider} />
            <div className={styles.receiptRow}>
               <span>SUBTOTAL YIELD</span>
               <span>Rs. {order.subtotal}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className={`${styles.receiptRow} ${styles.discountText}`}>
                 <span>OVERRIDE APPLIED</span>
                 <span>- Rs. {order.discount_amount}</span>
              </div>
            )}
            <div className={`${styles.receiptRow} ${styles.finalTotal}`}>
               <span>FINAL SETTLEMENT</span>
               <span>Rs. {order.total}</span>
            </div>
          </div>
        </section>

        {isReserved && (
          <div className={styles.cancelContainer}>
            <button className={styles.cancelBtn} onClick={handleCancelOrder}>
              TERMINATE RESERVATION
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
  </div>
  );
}
