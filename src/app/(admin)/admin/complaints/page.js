'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

import styles from './page.module.css';

export default function AdminComplaints() {
  const supabase = createClient();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('complaints').select('*, reporter:reporter_id(full_name), order:order_id(reservation_code, outlet:outlet_id(name))');
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  const handleResolve = async (id, resolutionStr) => {
    const res = prompt(`Enter resolution notes for complaint #${id.slice(0,6)}:`);
    if (res === null) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('complaints').update({ status: resolutionStr, resolution: res, resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', id);
    loadComplaints();
  };

  const statusBadge = (s) => ({ open: 'badge-coral', investigating: 'badge-amber', resolved: 'badge-teal', dismissed: 'badge-neutral' }[s] || 'badge-neutral');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Complaints Queue</h1>
      </header>

      <div className={styles.filters}>
        {['open', 'investigating', 'resolved', 'dismissed', 'all'].map(f => (
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
        <div className={styles.loadingState}>Loading...</div>
      ) : (
        <div className={styles.grid}>
          {complaints.map(c => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{c.type.replace(/_/g, ' ').toUpperCase()}</h3>
                  <span className={styles.cardMeta}>Order: {c.order?.reservation_code} ({c.order?.outlet?.name}) • Reported by {c.reporter?.full_name}</span>
                </div>
                <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
              </div>
              <div className={styles.descriptionBox}>
                {c.description}
              </div>
              {(c.status === 'open' || c.status === 'investigating') && (
                <div className={styles.actions}>
                  <button className={styles.btnPrimary} onClick={() => handleResolve(c.id, 'resolved')}>Mark Resolved</button>
                  <button className={styles.btnGhost} onClick={() => handleResolve(c.id, 'dismissed')}>Dismiss</button>
                </div>
              )}
              {c.resolution && (
                <div className={styles.resolution}>
                  <strong className={styles.resolutionLabel}>Resolution:</strong> {c.resolution}
                </div>
              )}
            </div>
          ))}
          {complaints.length === 0 && <div className={styles.card}><span className={styles.emptyMeta}>No complaints found.</span></div>}
        </div>
      )}
    </div>
  );
}
