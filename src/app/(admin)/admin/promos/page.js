'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import ZeroState from '@/components/spatial/ZeroState';
import styles from './page.module.css';

export default function AdminPromos() {
  const supabase = useMemo(() => createClient(), []);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', discount_type: 'percentage', discount_value: '', valid_until: '' });

  const loadPromos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setPromos(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadPromos(); }, [loadPromos]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await supabase.from('promo_codes').insert({
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      is_active: true,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
    });
    setFormData({ code: '', discount_type: 'percentage', discount_value: '', valid_until: '' });
    setShowModal(false);
    loadPromos();
  };

  const togglePromoStatus = async (id, currentStatus) => {
    await supabase.from('promo_codes').update({ is_active: !currentStatus }).eq('id', id);
    loadPromos();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Promo Codes</h1>
          <p className={styles.subtitle}>Manage customer incentives and marketing campaigns.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className={styles.plusIcon}>+</span>
          Create New Code
        </button>
      </header>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className="text-gradient">Generate Promo</h2>
            <form onSubmit={handleCreate} className={styles.formGrid}>
              <div className={`${styles.fullWidth} form-group`}>
                <label className="form-label">Coupon Code</label>
                <input 
                  type="text" 
                  className="form-input input-uppercase" 
                  required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  placeholder="e.g. FRESH2024" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Discount Type</label>
                <select className="form-input" value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (Rs.)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Value</label>
                <input type="number" step="0.01" className="form-input" required value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} placeholder="e.g. 20" />
              </div>

              <div className={`${styles.fullWidth} form-group`}>
                <label className="form-label">Valid Until (optional)</label>
                <input type="date" className="form-input" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableSubstrate}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className="skeleton-text skeleton-centered"></div>
            <p>Sequencing data streams...</p>
          </div>
        ) : promos.length === 0 ? (
          <ZeroState 
            icon="🎟️"
            title="Static Campaign Substrate"
            description="No active promotional codes detected in the registry. Initialize a new campaign to stimulate marketplace resonance."
          />
        ) : (
          <table className={styles.promoTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id} className={styles.promoRow}>
                  <td><span className={styles.promoCode}>{p.code}</span></td>
                  <td>
                    <span className={styles.discountBadge}>
                      {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : `Rs. ${p.discount_value} OFF`}
                    </span>
                  </td>
                  <td>{p.usage_count || 0} redeemed</td>
                  <td>
                    <span className={p.valid_until && new Date(p.valid_until) < new Date() ? styles.expiredDate : ''}>
                      {p.valid_until ? new Date(p.valid_until).toLocaleDateString() : 'Infinite'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.statusWrapper}>
                      <span className={`badge ${p.is_active ? 'badge-teal' : 'badge-neutral'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => togglePromoStatus(p.id, p.is_active)}>
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
