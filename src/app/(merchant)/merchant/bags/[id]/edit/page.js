'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function EditBag({ params }) {
  const { id } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const [bag, setBag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadBag = useCallback(async () => {
    const { data } = await supabase.from('rescue_bags').select('*').eq('id', id).single();
    if (data) {
      data.pickup_start_local = data.pickup_start ? new Date(data.pickup_start).toISOString().slice(0, 16) : '';
      data.pickup_end_local = data.pickup_end ? new Date(data.pickup_end).toISOString().slice(0, 16) : '';
      setBag(data);
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { loadBag(); }, [loadBag]);

  const update = (field, value) => setBag(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const { error: err } = await supabase.from('rescue_bags').update({
        title: bag.title,
        category: bag.category,
        retail_value_estimate: Number(bag.retail_value_estimate),
        rescue_price: Number(bag.rescue_price),
        quantity_total: Number(bag.quantity_total),
        quantity_remaining: Number(bag.quantity_remaining),
        pickup_start: bag.pickup_start_local ? new Date(bag.pickup_start_local).toISOString() : bag.pickup_start,
        pickup_end: bag.pickup_end_local ? new Date(bag.pickup_end_local).toISOString() : bag.pickup_end,
        notes: bag.notes,
        allergens: bag.allergens,
        status: bag.status,
      }).eq('id', id);
      if (err) throw err;
      router.push('/merchant/bags');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove this bag? Active orders will be cancelled.')) return;
    await supabase.from('rescue_bags').update({ status: 'removed' }).eq('id', id);
    router.push('/merchant/bags');
  };

  if (loading) return <div className={styles.loadingState}>Loading...</div>;
  if (!bag) return <div className={styles.notFound}>Bag not found.</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>Edit Bag</h1>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.formCard}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Title</label>
          <input className={styles.input} value={bag.title} onChange={e => update('title', e.target.value)} />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Category</label>
          <select className={styles.select} value={bag.category} onChange={e => update('category', e.target.value)}>
            <option value="bakery">Bakery</option><option value="cafe">Café</option>
            <option value="mixed_meals">Mixed Meals</option><option value="groceries">Groceries</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Retail Value (Rs.)</label>
            <input className={styles.input} type="number" value={bag.retail_value_estimate} onChange={e => update('retail_value_estimate', e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Rescue Price (Rs.)</label>
            <input className={styles.input} type="number" value={bag.rescue_price} onChange={e => update('rescue_price', e.target.value)} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Total Qty</label>
            <input className={styles.input} type="number" value={bag.quantity_total} onChange={e => update('quantity_total', e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Remaining</label>
            <input className={styles.input} type="number" value={bag.quantity_remaining} onChange={e => update('quantity_remaining', e.target.value)} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pickup Start</label>
            <input className={styles.input} type="datetime-local" value={bag.pickup_start_local} onChange={e => update('pickup_start_local', e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pickup End</label>
            <input className={styles.input} type="datetime-local" value={bag.pickup_end_local} onChange={e => update('pickup_end_local', e.target.value)} />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Notes</label>
          <textarea className={styles.textarea} rows={3} value={bag.notes || ''} onChange={e => update('notes', e.target.value)} />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Status</label>
          <select className={styles.select} value={bag.status} onChange={e => update('status', e.target.value)}>
            <option value="draft">Draft</option><option value="live">Live</option><option value="paused">Paused</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.removeBtn} onClick={handleRemove}>Remove Bag</button>
        <button className={styles.saveBtn} disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}