'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import { ensureOutletDemoListings } from '@/lib/ensureOutletDemoListings';
import { outletListingMode, MERCHANT_OUTLET_CATEGORIES } from '@/lib/outletListingMode';
import { outletCategoryWarnings } from '@/lib/outletCategoryWarning';

export default function MerchantOutletEditorPage() {
  const { id } = useParams();
  const outletId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { refetch: refetchMerchantContext } = useMerchantContext();
  const supabase = createClient();
  const [outlet, setOutlet] = useState(null);
  const [category, setCategory] = useState('restaurant');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!outletId) return;
    void (async () => {
      const { data } = await supabase
        .from('outlets')
        .select('id, name, category, address')
        .eq('id', outletId)
        .maybeSingle();
      if (data) {
        setOutlet(data);
        setCategory(data.category ?? 'restaurant');
      }
    })();
  }, [outletId, supabase]);

  const save = async () => {
    if (!outletId) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from('outlets')
      .update({ category })
      .eq('id', outletId);
    if (!updateError) {
      await ensureOutletDemoListings(outletId);
      await refetchMerchantContext();
    }
    setOutlet((prev) => (prev ? { ...prev, category } : prev));
    setSaving(false);
    router.back();
  };

  if (!outlet) {
    return <div className="p-xl">Loading outlet…</div>;
  }

  const mode = outletListingMode(category);
  const categoryWarnings = outletCategoryWarnings(outlet.name, category);

  return (
    <main className="max-w-xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <Link href="/merchant/outlets" className="text-sm text-primary">
        ← Outlets
      </Link>
      <h1 className="font-h1 text-h1">{outlet.name}</h1>
      <p className="text-sm text-text-muted">{outlet.address}</p>
      <label className="block space-y-xs">
        <span className="font-label text-sm">Category (controls listing mode)</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full h-11 rounded-xl border border-divider px-3"
        >
          {MERCHANT_OUTLET_CATEGORIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {category === 'hotel' ? (
            <option value="hotel">Legacy: hotel (use Bags &amp; shelves)</option>
          ) : null}
        </select>
      </label>
      <p className="text-sm text-text-muted">
        Listing mode: <strong>{mode}</strong>
        {mode === 'clearance_shelf' ? ' — publish clearance shelves instead of rescue bags.' : ''}
        {mode === 'hybrid' ? ' — bags and shelves.' : ''}
      </p>
      {categoryWarnings.length > 0 ? (
        <ul className="space-y-2" role="status">
          {categoryWarnings.map((msg) => (
            <li
              key={msg}
              className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-text"
            >
              {msg}
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="h-11 px-6 rounded-xl bg-primary text-white font-label font-bold"
      >
        {saving ? 'Saving…' : 'Save & go to inventory'}
      </button>
    </main>
  );
}
