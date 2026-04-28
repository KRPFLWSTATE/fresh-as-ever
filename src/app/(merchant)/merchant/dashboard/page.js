'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import styles from './page.module.css';
import ZeroState from '@/components/spatial/ZeroState';

export default function MerchantDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [merchant, setMerchant] = useState(null);
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, activeBags: 0, pendingPickups: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pulse registry for merchant identity data
      const { data: merchantData, error: mErr } = await supabase
        .from('merchants')
        .select(`
          *,
          outlets(*)
        `)
        .eq('owner_id', user.id)
        .single();

      if (mErr || !merchantData) {
         setLoading(false);
         return;
      }
      setMerchant(merchantData);

      // Operational Guard: Ensure approval before substrate access
      if (merchantData.status !== 'approved') {
        setLoading(false);
        return;
      }

      const outletIds = (merchantData.outlets || []).map(o => o.id);
      if (outletIds.length === 0) { setLoading(false); return; }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Synchronizing today's delta
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('id, total, order_status, reservation_code, created_at, bag:rescue_bags(title), customer:profiles(full_name)')
        .in('outlet_id', outletIds)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false });

      // Active operational nodes
      const { data: activeBags } = await supabase
        .from('rescue_bags')
        .select('id')
        .in('outlet_id', outletIds)
        .eq('status', 'active');

      // Transfer queue volume
      const { data: pendingPickups } = await supabase
        .from('orders')
        .select('id')
        .in('outlet_id', outletIds)
        .in('order_status', ['reserved', 'awaiting_pickup', 'paid']);

      const revenue = (todayOrders || [])
        .filter(o => o.order_status === 'collected')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      setStats({
        todayOrders: (todayOrders || []).length,
        todayRevenue: revenue,
        activeBags: (activeBags || []).length,
        pendingPickups: (pendingPickups || []).length,
      });

      setRecentOrders((todayOrders || []).slice(0, 5));
    } catch (err) {
      console.error('Neural Dashboard Failure:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDashboard();
    
    // Real-time metric synchronization
    const channel = supabase
      .channel('merchant-dashboard-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_bags' }, () => loadDashboard())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadDashboard, supabase]);

if (loading) {
    return (
      <div className={styles.page}>
         <div className={styles.loadingContainer}>
           <div className={styles.loadingContent}>
             <h2 className={styles.loadingTitle}>SYNCING COMMAND CENTER</h2>
             <p className={styles.loadingText}>Authenticating neural gateway...</p>
           </div>
         </div>
      </div>
    );
  }

  // Handle Protocol States (Pending/Rejected/Suspended)
  if (merchant && merchant.status === 'pending') {
    return (
      <div className={styles.page}>
        <div className={styles.statusContainer}>
          <ZeroState 
            icon="⌛"
            title="Registry Auth Pending"
            description="Our node administrators are currently validating your merchant credentials. You will receive a kinetic notification upon approval."
          />
        </div>
      </div>
    );
  }

  if (merchant && merchant.status === 'rejected') {
    return (
      <div className={styles.page}>
        <div className={styles.statusContainer}>
          <ZeroState 
            icon="❌"
            title="Substrate Connection Denied"
            description={merchant.rejection_reason || "Critical validation failure in your application credentials."}
            action={<Link href="/merchant/onboarding" className={styles.reinitBtn}>RE-INITIALIZE APP</Link>}
          />
        </div>
      </div>
    );
  }

  // Standard Operational Layout
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>Commanding Officer,</p>
          <h1 className={styles.businessName}>{merchant?.business_name || 'Merchant'}</h1>
        </div>
        <Link href="/merchant/bags/create" className={styles.newNodeBtn}>+ NEW NODE</Link>
      </header>

      {/* Metric Pulsars */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.todayOrders}</span>
          <span className={styles.statLabel}>Syncs Today</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>Rs. {stats.todayRevenue.toLocaleString()}</span>
          <span className={styles.statLabel}>Revenue Delta</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.activeBags}</span>
          <span className={styles.statLabel}>Active Substrates</span>
        </div>
        <div className={`${styles.statCard} ${stats.pendingPickups > 0 ? styles.statCardAlert : ''}`}>
          <span className={styles.statValue}>{stats.pendingPickups}</span>
          <span className={styles.statLabel}>Awaiting Handover</span>
        </div>
      </div>

      {/* Actions Matrix */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Command Matrix</h3>
        <div className={styles.actionsGrid}>
          <Link href="/merchant/bags/create" className={styles.actionCard}>
            <span className={styles.actionIcon}>🛍️</span>
            <span>DEPLOY NODE</span>
          </Link>
          <Link href="/merchant/orders" className={styles.actionCard}>
            <span className={styles.actionIcon}>📋</span>
            <span>ORDER FEED</span>
          </Link>
          <Link href="/merchant/orders?verify=true" className={styles.actionCard}>
            <span className={styles.actionIcon}>✅</span>
            <span>VERIFY KEY</span>
          </Link>
          <Link href="/merchant/finance" className={styles.actionCard}>
            <span className={styles.actionIcon}>💰</span>
            <span>REVENUE delta</span>
          </Link>
        </div>
      </section>

      {/* Neural Order Feed */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Neural Order Stream</h3>
          <Link href="/merchant/orders" className={styles.viewAllBtn}>VIEW ALL</Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <ZeroState 
            icon="📦"
            title="Feed Silent"
            description="Your order queue is currently silent. Re-broadcast your rescue bags to attract new reservations."
          />
        ) : (
          <div className={styles.ordersList}>
            {recentOrders.map(order => (
              <Link href="/merchant/orders" key={order.id} className={styles.orderRow}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderTitle}>{order.bag?.title || 'Rescue Bag'}</span>
                  <span className={styles.orderMeta}>
                    {order.customer?.full_name || 'Anonymous'} · {order.reservation_code}
                  </span>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.orderAmount}>Rs. {Number(order.total).toLocaleString()}</span>
                  <span className={styles.badgeBlur}>
                    {order.order_status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

