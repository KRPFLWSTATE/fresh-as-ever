'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

import styles from './page.module.css';

export default function AdminOrders() {
  const supabase = createClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*, bag:bag_id(title), customer:customer_id(full_name), outlet:outlet_id(name)');
    
    if (filter !== 'all') {
      query = query.eq('order_status', filter);
    }
    
    const { data } = await query.order('created_at', { ascending: false }).limit(100);
    setOrders(data || []);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const statusBadge = (s) => ({
    reserved: 'badge-teal', paid: 'badge-teal', awaiting_pickup: 'badge-amber',
    collected: 'badge-teal', cancelled: 'badge-coral', no_show: 'badge-coral',
    refunded: 'badge-neutral', disputed: 'badge-coral',
  }[s] || 'badge-neutral');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Order Monitor</h1>
      </header>

      <div className={styles.filters}>
        {['all', 'reserved', 'awaiting_pickup', 'collected', 'no_show', 'cancelled', 'refunded', 'disputed'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`${styles.filterChip} ${filter === f ? styles.active : ''}`}
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Item & Outlet</th>
                <th>Customer</th>
                <th>Total (Rs.)</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td><span className={styles.refCode}>{o.reservation_code}</span></td>
                  <td>
                    <div className={styles.itemPrimary}>{o.bag?.title}</div>
                    <div className={styles.itemMeta}>{o.outlet?.name}</div>
                  </td>
                  <td className={styles.itemSecondary}>{o.customer?.full_name}</td>
                  <td className={styles.itemPrimary}>{Number(o.total).toLocaleString()}</td>
                  <td><span className={`badge ${statusBadge(o.order_status)}`}>{o.order_status.replace(/_/g, ' ')}</span></td>
                  <td className={styles.itemMeta}>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="6" className={styles.emptyState}>No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
