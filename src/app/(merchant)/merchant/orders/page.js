'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function MerchantOrders() {
  const searchParams = useSearchParams();
  const showVerify = searchParams.get('verify') === 'true';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(showVerify ? 'awaiting_pickup' : 'all');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const loadOrders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchant } = await supabase
        .from('merchants')
        .select('outlets(id)')
        .eq('owner_id', user.id)
        .single();

      if (!merchant) return;
      const outletIds = merchant.outlets.map(o => o.id);

      let query = supabase
        .from('orders')
        .select(`
          *,
          bag:rescue_bags(title, category),
          customer:profiles(full_name, phone)
        `)
        .in('outlet_id', outletIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('order_status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Queue sync failure:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [supabase, filter]);

  useEffect(() => {
    loadOrders();
    
    // Kinetic Queue Sync: Real-time order tracking
    const channel = supabase
      .channel('merchant-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders(true);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadOrders, supabase]);

  const handleVerifyPickup = async (overrideCode) => {
    const codeToVerify = overrideCode || verifyCode;
    if (!codeToVerify.trim()) return;
    
    try {
      setVerifyLoading(true);
      setVerifyResult(null);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: merchant } = await supabase
        .from('merchants')
        .select('outlets(id)')
        .eq('owner_id', user.id)
        .single();

      const outletIds = merchant.outlets.map(o => o.id);

      // Verify protocol against spatial registry
      const { data: order, error: findErr } = await supabase
        .from('orders')
        .select('id, order_status, reservation_code')
        .eq('reservation_code', codeToVerify.trim().toUpperCase())
        .in('outlet_id', outletIds)
        .single();

      if (findErr || !order) {
        setVerifyResult({ success: false, message: 'Registry Error: Invalid reservation sequence.' });
        return;
      }

      if (order.order_status === 'collected') {
        setVerifyResult({ success: false, message: 'Protocol already finalized: Item handed over.' });
        return;
      }

      // Finalize transfer
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          order_status: 'collected',
          collected_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateErr) throw updateErr;

      setVerifyResult({ success: true, message: 'TRANSFER AUTHORIZED: Key verified successfully.' });
      setVerifyCode('');
      loadOrders(true);
    } catch (err) {
      setVerifyResult({ success: false, message: 'Auth System Failure: ' + err.message });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleNoShow = async (orderId) => {
    if (!confirm('Neural Protocol: Mark this entity as a no-show?')) return;
    try {
      await supabase.from('orders').update({ order_status: 'no_show' }).eq('id', orderId);
      loadOrders(true);
    } catch (err) {
       console.error("No-show mark failed", err);
    }
  };

  const getStatusText = (status) => {
    const map = {
      reserved: 'ACTIVE RESERVE',
      paid: 'SETTLED RESERVE',
      awaiting_pickup: 'READY FOR HANDOVER',
      collected: 'FINALIZED',
      cancelled: 'ABORTED',
      no_show: 'NO-SHOW',
      refunded: 'REFUNDED'
    };
    return map[status] || status.toUpperCase().replace('_', ' ');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>ORDER COMMAND</h1>
      </header>

      {/* Terminal Verification Plate */}
      <div className={styles.verifySection}>
        <h3 className={styles.verifyTitle}>TERMINAL VERIFICATION</h3>
        <p className={styles.verifyHint}>Input 6-digit reservation protocol key</p>
        <div className={styles.verifyRow}>
          <input
            className={styles.verifyInput}
            placeholder="XXXXXX"
            maxLength={6}
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleVerifyPickup()}
          />
          <button 
            className={styles.verifyBtn}
            disabled={verifyLoading || verifyCode.length < 4} 
            onClick={() => handleVerifyPickup()} 
          >
            {verifyLoading ? '...' : 'EXECUTE'}
          </button>
        </div>
        {verifyResult && (
          <div className={`${styles.verifyResult} ${verifyResult.success ? styles.verifySuccess : styles.verifyError}`}>
            {verifyResult.message}
          </div>
        )}
      </div>

      {/* Command Filters */}
      <div className={styles.filters}>
        {['all', 'reserved', 'collected', 'no_show', 'cancelled'].map(f => (
          <button key={f} className={`${styles.filterChip} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'LIVE QUEUE' : f.toUpperCase().replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Order Matrix */}
      {loading && orders.length === 0 ? (
        <div className={styles.loadingState}>
          <h2 className={styles.loadingTitle}>SYNCING QUEUE</h2>
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>NO ACTIVE SIGNALS</h2>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderTop}>
                <div className={styles.orderInfo}>
                  <h3 className={styles.orderTitle}>{order.bag?.title || 'Unknown Entity'}</h3>
                  <p className={styles.orderCustomer}>{order.customer?.full_name || 'Anonymous User'}</p>
                </div>
                <span className={styles.orderStatus} data-status={order.order_status}>
                  {getStatusText(order.order_status)}
                </span>
              </div>
              
              <div className={styles.orderMeta}>
                <div>KEY: <strong>{order.reservation_code}</strong></div>
                <div>EXCHANGE: <strong>Rs. {Number(order.total).toLocaleString()}</strong></div>
                <div className={styles.metaLabel}>METHOD: <span className={styles.metaValue}>{order.payment_method}</span></div>
                <div>TIMESTAMP: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              {['reserved', 'paid', 'awaiting_pickup'].includes(order.order_status) && (
                <div className={styles.orderActions}>
                  <button 
                    className={styles.authorizeBtn} 
                    onClick={() => handleVerifyPickup(order.reservation_code)} 
                  >
                    AUTHORIZE HANDOVER
                  </button>
                  <button 
                    className={styles.noshowBtn} 
                    onClick={() => handleNoShow(order.id)} 
                  >
                    NO-SHOW
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
