'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Plus, X, Star, Trash } from '@phosphor-icons/react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useCustomerOrdersHistory } from '@/hooks/useCustomerOrdersHistory';

export default function PaymentsPage() {
  const router = useRouter();
  const { methods, loading, addMethod, setDefault, removeMethod } = usePaymentMethods();
  const { rows: orderHistory, loading: historyLoading, error: historyError } = useCustomerOrdersHistory();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [brand, setBrand] = useState('Visa');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');
  const [label, setLabel] = useState('');

  const openModal = () => {
    setFormError('');
    setBrand('Visa');
    setLast4('');
    setExpiry('');
    setLabel('');
    setModalOpen(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    const digits = last4.replace(/\D/g, '');
    if (digits.length < 4) {
      setFormError('Enter the last 4 digits on the card.');
      return;
    }
    try {
      setSaving(true);
      await addMethod({
        brand,
        last4: digits.slice(-4),
        expiry: expiry.trim() || '—',
        label: label.trim(),
      });
      setModalOpen(false);
    } catch (err) {
      setFormError(err?.message || 'Could not save payment method.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-black text-text tracking-tight">Payment Methods</h1>
          <p className="font-body-sm text-text-muted mt-1">
            Saved for your account (display only — no full card numbers stored in the app).
          </p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-page-margin-mobile py-lg space-y-lg pb-32">
        {loading && (
          <div className="bg-surface rounded-xl p-md border border-divider animate-pulse h-24" />
        )}

        {!loading && methods.length === 0 && (
          <p className="font-body-sm text-text-muted text-center py-4">
            No saved methods yet. Add a card label for faster checkout.
          </p>
        )}

        {!loading &&
          methods.map((m) => (
            <div
              key={m.id}
              className="bg-surface rounded-xl p-md shadow-[0_4px_12px_rgba(30,27,20,0.04)] flex items-center gap-md border border-divider"
            >
              <div className="w-12 h-12 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                <CreditCard size={24} weight="bold" className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label text-label text-text truncate">
                  {m.label || `${m.brand} •••• ${m.last4}`}
                </p>
                <p className="font-body-sm text-body-sm text-text-muted">
                  Expires {m.expiry || '—'}
                </p>
              </div>
              {m.isDefault && (
                <span className="bg-success/10 text-success px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0">
                  Default
                </span>
              )}
              {!m.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefault(m.id)}
                  className="p-2 rounded-lg text-primary hover:bg-surface-2 border border-transparent hover:border-divider shrink-0"
                  aria-label="Set as default"
                >
                  <Star size={22} weight="bold" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeMethod(m.id)}
                className="p-2 rounded-lg text-error hover:bg-error/10 shrink-0"
                aria-label="Remove"
              >
                <Trash size={22} weight="bold" />
              </button>
            </div>
          ))}

        <button
          type="button"
          onClick={openModal}
          className="w-full py-4 rounded-xl border-2 border-dashed border-divider text-text-muted font-label text-label flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors active:scale-[0.97]"
        >
          <Plus size={20} weight="bold" />
          Add Payment Method
        </button>

        <section className="mt-xl space-y-md">
          <h2 className="font-h3 text-h3 text-text">Recent rescue purchases</h2>
          {historyError ? <p className="font-body-sm text-error">{historyError}</p> : null}
          {historyLoading ? (
            <div className="h-24 bg-surface-2 animate-pulse rounded-xl border border-divider" />
          ) : orderHistory.length === 0 ? (
            <p className="font-body-sm text-text-muted">No paid orders yet.</p>
          ) : (
            <ul className="divide-y divide-divider bg-surface rounded-xl border border-divider">
              {orderHistory.slice(0, 10).map((row) => (
                <li key={row.id} className="p-md flex justify-between gap-md">
                  <div>
                    <p className="font-label font-bold text-text">{row.bag_title}</p>
                    <p className="font-body-sm text-text-muted">
                      {row.outlet_name} · {row.reservation_code || row.id.slice(0, 8)}
                    </p>
                  </div>
                  <p className="font-label text-primary font-bold">
                    Rs. {Math.round(row.total).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-surface rounded-t-2xl sm:rounded-2xl p-xl border border-divider shadow-elevation-lg">
            <div className="flex justify-between items-center mb-lg">
              <h2 className="font-h3 text-h3 text-text">Add payment method</h2>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-surface-2 text-text-muted"
                onClick={() => setModalOpen(false)}
              >
                <X size={24} weight="bold" />
              </button>
            </div>
            <form className="space-y-md" onSubmit={handleAdd}>
              {formError && (
                <p className="text-error font-body-sm font-medium">{formError}</p>
              )}
              <div>
                <label className="block font-label text-xs font-bold text-text-muted mb-1" htmlFor="pm-brand">
                  Brand
                </label>
                <select
                  id="pm-brand"
                  className="w-full rounded-xl border border-divider bg-surface-2 py-3 px-4 font-body-md text-text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  {['Visa', 'Mastercard', 'Amex', 'Other'].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label text-xs font-bold text-text-muted mb-1" htmlFor="pm-last4">
                  Last 4 digits
                </label>
                <input
                  id="pm-last4"
                  className="w-full rounded-xl border border-divider bg-surface-2 py-3 px-4 font-body-md text-text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4242"
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div>
                <label className="block font-label text-xs font-bold text-text-muted mb-1" htmlFor="pm-expiry">
                  Expiry (MM/YY)
                </label>
                <input
                  id="pm-expiry"
                  className="w-full rounded-xl border border-divider bg-surface-2 py-3 px-4 font-body-md text-text"
                  placeholder="12/27"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-label text-xs font-bold text-text-muted mb-1" htmlFor="pm-label">
                  Label (optional)
                </label>
                <input
                  id="pm-label"
                  className="w-full rounded-xl border border-divider bg-surface-2 py-3 px-4 font-body-md text-text"
                  placeholder="Personal Visa"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 rounded-xl bg-primary text-white font-label font-bold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
