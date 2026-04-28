'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function CreateBag() {
  const supabase = createClient();
  const router = useRouter();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    outlet_id: '',
    title: '',
    category: 'bakery',
    retail_value_estimate: '',
    rescue_price: '',
    quantity_total: 1,
    pickup_start: '',
    pickup_end: '',
    notes: '',
    allergens: [],
    status: 'live', // direct-publish by default for speed
  });

  const loadOutlets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: merchant } = await supabase
      .from('merchants')
      .select('outlets(id, name)')
      .eq('owner_id', user.id)
      .single();

    if (merchant?.outlets) {
      setOutlets(merchant.outlets);
      if (merchant.outlets.length > 0) {
        setForm(prev => ({ ...prev, outlet_id: merchant.outlets[0].id }));
      }
    }
  }, [supabase]);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const discount = form.retail_value_estimate && form.rescue_price
    ? Math.round((1 - Number(form.rescue_price) / Number(form.retail_value_estimate)) * 100)
    : null;

  const isValid = form.outlet_id && form.title && form.rescue_price && form.retail_value_estimate && form.pickup_start && form.pickup_end;

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (discount !== null && discount < 40) {
        setError('Rescue price must be at least 40% below the retail value (minimum value rule).');
        setLoading(false);
        return;
      }

      const { error: insertErr } = await supabase.from('rescue_bags').insert({
        outlet_id: form.outlet_id,
        title: form.title,
        category: form.category,
        retail_value_estimate: Number(form.retail_value_estimate),
        rescue_price: Number(form.rescue_price),
        quantity_total: Number(form.quantity_total),
        quantity_remaining: Number(form.quantity_total),
        pickup_start: new Date(form.pickup_start).toISOString(),
        pickup_end: new Date(form.pickup_end).toISOString(),
        notes: form.notes,
        allergens: form.allergens.length > 0 ? form.allergens : null,
        status: form.status,
      });

      if (insertErr) throw insertErr;
      router.push('/merchant/bags');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1>Create Rescue Bag</h1>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.formCard}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Outlet <span className={styles.required}>*</span></label>
          <select className={styles.select} value={form.outlet_id} onChange={e => updateField('outlet_id', e.target.value)}>
            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Bag Title <span className={styles.required}>*</span></label>
          <input className={styles.input} placeholder="e.g. Mystery Bakery Bag" value={form.title} onChange={e => updateField('title', e.target.value)} />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Category</label>
          <select className={styles.select} value={form.category} onChange={e => updateField('category', e.target.value)}>
            <option value="bakery">🍞 Bakery</option>
            <option value="cafe">☕ Café</option>
            <option value="mixed_meals">🍛 Mixed Meals</option>
            <option value="groceries">🛒 Groceries</option>
            <option value="other">📦 Other</option>
          </select>
        </div>

        <div className={styles.priceRow}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Retail Value (Rs.) <span className={styles.required}>*</span></label>
            <input className={styles.input} type="number" placeholder="2000" value={form.retail_value_estimate} onChange={e => updateField('retail_value_estimate', e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Rescue Price (Rs.) <span className={styles.required}>*</span></label>
            <input className={styles.input} type="number" placeholder="800" value={form.rescue_price} onChange={e => updateField('rescue_price', e.target.value)} />
          </div>
        </div>

        {discount !== null && (
          <div className={`${styles.discountBanner} ${discount >= 40 ? styles.discountGood : styles.discountBad}`}>
            {discount >= 40
              ? `✅ ${discount}% discount — Great value for customers!`
              : `⚠️ ${discount}% discount — Must be at least 40% off retail value.`}
          </div>
        )}

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Quantity <span className={styles.required}>*</span></label>
          <input className={styles.input} type="number" min="1" max="100" value={form.quantity_total} onChange={e => updateField('quantity_total', e.target.value)} />
        </div>

        <div className={styles.priceRow}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pickup Start <span className={styles.required}>*</span></label>
            <input className={styles.input} type="datetime-local" value={form.pickup_start} onChange={e => updateField('pickup_start', e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pickup End <span className={styles.required}>*</span></label>
            <input className={styles.input} type="datetime-local" value={form.pickup_end} onChange={e => updateField('pickup_end', e.target.value)} />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>What's inside? (Hint for customers)</label>
          <textarea className={styles.textarea} rows={3} placeholder="e.g. May contain pastries, bread rolls, cakes — contents vary by surplus today" value={form.notes} onChange={e => updateField('notes', e.target.value)} />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Allergens</label>
          <div className={styles.allergenChips}>
            {['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'fish', 'shellfish'].map(a => (
              <button key={a} type="button" className={`${styles.allergenChip} ${form.allergens.includes(a) ? styles.allergenActive : ''}`}
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    allergens: prev.allergens.includes(a) ? prev.allergens.filter(x => x !== a) : [...prev.allergens, a]
                  }));
                }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Publish immediately?</label>
          <select className={styles.select} value={form.status} onChange={e => updateField('status', e.target.value)}>
            <option value="live">Yes — Go live now</option>
            <option value="draft">No — Save as draft</option>
          </select>
        </div>
      </div>

      <button className={styles.submitBtn} disabled={!isValid || loading} onClick={handleCreate}>
        {loading ? 'Creating...' : form.status === 'live' ? '🚀 Publish Rescue Bag' : '💾 Save Draft'}
      </button>
    </div>
  );
}
