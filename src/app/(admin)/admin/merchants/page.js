'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminMerchants() {
  const supabase = createClient();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const loadMerchants = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('merchants').select('*, profiles:owner_id(full_name, email)');
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setMerchants(data || []);
    } catch (err) {
      console.error('Error loading merchants:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => { loadMerchants(); }, [loadMerchants]);

  const statusBadge = (s) => {
    switch (s) {
      case 'approved': return 'badge-teal';
      case 'pending': return 'badge-amber';
      case 'suspended': return 'badge-coral';
      case 'rejected': return 'badge-coral';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Merchant Registry</h1>
        <p className={styles.headerSubtitle}>Platform Access Governance</p>
      </header>

      <div className={styles.filters}>
        {['pending', 'approved', 'suspended', 'rejected', 'all'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterChip} ${filter === f ? styles.active : ''}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          Synchronizing Merchant Registry...
        </div>
      ) : (
        <div className={styles.tableContainer}>
          {merchants.map(m => (
            <div key={m.id} className={styles.merchantRow}>
              <div className={styles.businessInfo}>
                <h3 className={styles.businessName}>{m.business_name}</h3>
                <div className={styles.ownerDetail}>
                  {m.profiles?.full_name} · {m.contact_phone}
                </div>
                <div className={styles.ownerMeta}>
                  ID: {m.id.split('-')[0]}... · Joined {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className={styles.statusIndicator}>
                <span className={`badge ${statusBadge(m.status)}`}>{m.status}</span>
                <Link href={`/admin/merchants/${m.id}`} className={styles.actionBtn}>
                  Review Credentials
                </Link>
              </div>
            </div>
          ))}
          
          {merchants.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🌫️</span>
              <h3 className={styles.emptyTitle}>No Merchants Detected</h3>
              <p className={styles.emptySubtitle}>Registry query for "{filter}" returned zero results.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
