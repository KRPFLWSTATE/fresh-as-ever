'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

const STEPS = ['Business Info', 'Outlet Details', 'Bank & Payout', 'Review'];

export default function MerchantOnboarding() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    business_name: '',
    legal_name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    business_registration_number: '',
    outlet_name: '',
    outlet_address: '',
    outlet_landmark: '',
    outlet_category: 'bakery',
    pickup_instructions: '',
    outlet_lat: 6.9271,
    outlet_lng: 79.8612,
    payout_method: 'bank_transfer',
    bank_name: '',
    account_number: '',
    branch: '',
    account_name: '',
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 0) return form.business_name && form.contact_name && form.contact_phone;
    if (step === 1) return form.outlet_name && form.outlet_address && form.outlet_category;
    if (step === 2) {
      if (form.payout_method === 'bank_transfer') return form.bank_name && form.account_number;
      return true;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('profiles')
        .update({ role: 'merchant_staff' })
        .eq('id', user.id);

      const { data: merchant, error: mErr } = await supabase
        .from('merchants')
        .insert({
          owner_id: user.id,
          business_name: form.business_name,
          legal_name: form.legal_name || form.business_name,
          contact_name: form.contact_name,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email || user.email,
          business_registration_number: form.business_registration_number,
          payout_method: form.payout_method,
          bank_details: form.payout_method === 'bank_transfer' ? {
            bank_name: form.bank_name,
            account_number: form.account_number,
            branch: form.branch,
            account_name: form.account_name,
          } : null,
          status: 'pending',
        })
        .select()
        .single();

      if (mErr) throw mErr;

      const { error: oErr } = await supabase
        .from('outlets')
        .insert({
          merchant_id: merchant.id,
          name: form.outlet_name,
          address: form.outlet_address,
          landmark: form.outlet_landmark,
          category: form.outlet_category,
          pickup_instructions: form.pickup_instructions,
          location: `SRID=4326;POINT(${form.outlet_lng} ${form.outlet_lat})`,
          is_active: false,
        });

      if (oErr) throw oErr;

      router.push('/merchant/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Become a Partner</h1>
        <p className={styles.subtitle}>Turn end-of-day surplus into revenue.</p>
      </header>

      <div className={styles.stepper}>
        {STEPS.map((label, i) => (
          <div key={label} className={`${styles.step} ${i <= step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}>
            <div className={styles.stepCircle}>{i < step ? '✓' : i + 1}</div>
            <span className={styles.stepLabel}>{label}</span>
          </div>
        ))}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {step === 0 && (
        <div className={styles.formCard}>
          <h3>Tell us about your business</h3>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Business Name <span className="required">*</span></label>
            <input className="input" placeholder="e.g. Perera Bakery" value={form.business_name} onChange={e => updateField('business_name', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Legal Name</label>
            <input className="input" placeholder="As registered (if different)" value={form.legal_name} onChange={e => updateField('legal_name', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Contact Person <span className="required">*</span></label>
            <input className="input" placeholder="Full name" value={form.contact_name} onChange={e => updateField('contact_name', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Contact Phone <span className="required">*</span></label>
            <input className="input" type="tel" placeholder="+94 77 123 4567" value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Email</label>
            <input className="input" type="email" placeholder="business@example.com" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Business Registration Number</label>
            <input className="input" placeholder="Optional — speeds up approval" value={form.business_registration_number} onChange={e => updateField('business_registration_number', e.target.value)} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={styles.formCard}>
          <h3>Your first outlet</h3>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Outlet Name <span className="required">*</span></label>
            <input className="input" placeholder="e.g. Perera Bakery — Bambalapitiya" value={form.outlet_name} onChange={e => updateField('outlet_name', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Address <span className="required">*</span></label>
            <textarea className="input" rows={2} placeholder="Full street address" value={form.outlet_address} onChange={e => updateField('outlet_address', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Landmark</label>
            <input className="input" placeholder="e.g. Near Bambalapitiya junction" value={form.outlet_landmark} onChange={e => updateField('outlet_landmark', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Category <span className="required">*</span></label>
            <select className="input" value={form.outlet_category} onChange={e => updateField('outlet_category', e.target.value)}>
              <option value="bakery">🍞 Bakery</option>
              <option value="cafe">☕ Café</option>
              <option value="restaurant">🍛 Restaurant</option>
              <option value="supermarket">🛒 Supermarket</option>
              <option value="hotel">🏨 Hotel</option>
              <option value="other">📦 Other</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Pickup Instructions</label>
            <textarea className="input" rows={2} placeholder="e.g. Enter through main entrance, counter on the right" value={form.pickup_instructions} onChange={e => updateField('pickup_instructions', e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.formCard}>
          <h3>Payout details</h3>
          <p className={styles.formHint}>How should we send you your earnings?</p>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payout Method</label>
            <select className="input" value={form.payout_method} onChange={e => updateField('payout_method', e.target.value)}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash Settlement</option>
            </select>
          </div>
          {form.payout_method === 'bank_transfer' && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Bank Name <span className="required">*</span></label>
                <input className="input" placeholder="e.g. Commercial Bank" value={form.bank_name} onChange={e => updateField('bank_name', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Account Number <span className="required">*</span></label>
                <input className="input" placeholder="Account number" value={form.account_number} onChange={e => updateField('account_number', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Branch</label>
                <input className="input" placeholder="Branch name" value={form.branch} onChange={e => updateField('branch', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Account Holder Name</label>
                <input className="input" placeholder="Name on account" value={form.account_name} onChange={e => updateField('account_name', e.target.value)} />
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className={styles.formCard}>
          <h3>Review your application</h3>
          <div className={styles.reviewSection}>
            <h4>Business</h4>
            <div className={styles.reviewRow}><span>Name:</span><strong>{form.business_name}</strong></div>
            <div className={styles.reviewRow}><span>Contact:</span><strong>{form.contact_name}</strong></div>
            <div className={styles.reviewRow}><span>Phone:</span><strong>{form.contact_phone}</strong></div>
          </div>
          <div className={styles.reviewSection}>
            <h4>Outlet</h4>
            <div className={styles.reviewRow}><span>Name:</span><strong>{form.outlet_name}</strong></div>
            <div className={styles.reviewRow}><span>Address:</span><strong>{form.outlet_address}</strong></div>
            <div className={styles.reviewRow}><span>Category:</span><strong>{form.outlet_category}</strong></div>
          </div>
          <div className={styles.reviewSection}>
            <h4>Payout</h4>
            <div className={styles.reviewRow}><span>Method:</span><strong>{form.payout_method === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}</strong></div>
            {form.payout_method === 'bank_transfer' && (
              <div className={styles.reviewRow}><span>Bank:</span><strong>{form.bank_name} — {form.account_number}</strong></div>
            )}
          </div>
          <div className={styles.terms}>
            <p>By submitting, you agree to the Fresh As Ever <a href="#">Merchant Partner Terms</a> and confirm that the information provided is accurate.</p>
          </div>
        </div>
      )}

      <div className={styles.navButtons}>
        {step > 0 && (
          <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>Back</button>
        )}
        {step < 3 ? (
          <button className="btn btn-primary" disabled={!canProceed()} onClick={() => setStep(step + 1)}>Continue</button>
        ) : (
          <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>
    </div>
  );
}
