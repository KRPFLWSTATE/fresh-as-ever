'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';
import Link from 'next/link';
import ZeroState from '@/components/spatial/ZeroState';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Authentication required: My Reservations data stream restricted.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id, quantity, total, order_status, created_at,
          bag:rescue_bags(title, image_url, pickup_start, pickup_end),
          outlet:outlets(name, address)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Neural registry failure: Order history unreachable.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>MY BACKLOG</h1>
        </header>
        <div className={styles.content}>
           <p className={styles.loadingText}>Synchronizing spatial records...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.order_status === 'reserved');
  const pastOrders = orders.filter(o => o.order_status !== 'reserved');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>TRANSACTION BACKLOG</h1>
      </header>

      {error ? (
        <div className={styles.emptyWrapper}>
          <ZeroState 
            icon="🔒"
            title="Registry Locked"
            description={error}
          />
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <ZeroState 
            icon="🛍️"
            title="Zero Resonance"
            description="No transaction artifacts found in your neural history."
            action={
              <Link href="/discover" className={styles.primaryBtn}>
                START INITIAL RESCUE
              </Link>
            }
          />
        </div>
      ) : (
        <main className={styles.content}>
          {activeOrders.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>PENDING TRANSFERS</h2>
              <div className={styles.list}>
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} router={router} isActive />
                ))}
              </div>
            </section>
          )}

          {pastOrders.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>ARCHIVED PROTOCOLS</h2>
              <div className={styles.list}>
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} router={router} />
                ))}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

function OrderCard({ order, router, isActive }) {
  const bag = order.bag || {};
  const outlet = order.outlet || {};

  return (
    <div 
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
      onClick={() => router.push(`/orders/${order.id}`)}
    >
      <img 
        src={bag.image_url || '/placeholder-bag.png'} 
        alt={bag.title} 
        className={styles.cardImage} 
        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=Food' }}
      />
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.bagTitle}>{bag.title}</h3>
          <span className={styles.orderStatus} data-status={order.order_status}>
            {order.order_status === 'reserved' ? 'ACTIVE' : order.order_status.toUpperCase()}
          </span>
        </div>
        <p className={styles.outletName}>{outlet.name}</p>
        
        {isActive && bag.pickup_end && (
           <p className={styles.pickupTime}>
            <span className={styles.icon}>🕒</span>
            EXPIRES {new Date(bag.pickup_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </p>
        )}
        
        <div className={styles.cardFooter}>
           <span className={styles.orderDate}>
             {new Date(order.created_at).toLocaleDateString()}
           </span>
           <span className={styles.orderTotal}>Rs. {order.total}</span>
        </div>
      </div>
    </div>
  );
}

