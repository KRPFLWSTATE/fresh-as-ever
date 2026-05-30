'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Barcode, Package, PlusCircle } from '@phosphor-icons/react';
import { useMerchantShelves } from '@/hooks/useMerchantShelves';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import { useBarcodeLookup } from '@/hooks/useBarcodeLookup';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setImmediateWindow(setPickupStart, setPickupEnd) {
  const now = new Date();
  const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  setPickupStart(toDatetimeLocal(now.toISOString()));
  setPickupEnd(toDatetimeLocal(end.toISOString()));
}

export default function MerchantShelfTodayPage() {
  const router = useRouter();
  const { activeOutlet } = useMerchantContext();
  const outletId = activeOutlet?.id ?? null;
  const outletLabel = activeOutlet?.name ?? 'Active outlet';
  const [pickupStart, setPickupStart] = useState('');
  const [pickupEnd, setPickupEnd] = useState('');
  const [draftItems, setDraftItems] = useState([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [err, setErr] = useState('');
  const { todayShelf, upsertShelf, loading } = useMerchantShelves(outletId);
  const { lookup, product, loading: lookupLoading } = useBarcodeLookup();

  useEffect(() => {
    if (todayShelf) {
      setDraftItems(
        (todayShelf.items ?? []).filter((i) => i.status !== 'removed'),
      );
      setPickupStart(toDatetimeLocal(todayShelf.pickup_start));
      setPickupEnd(toDatetimeLocal(todayShelf.pickup_end));
    } else {
      setImmediateWindow(setPickupStart, setPickupEnd);
    }
  }, [todayShelf]);

  const addProductToDraft = (p) => {
    setDraftItems((prev) => [
      ...prev,
      {
        name_snapshot: p.name,
        brand_snapshot: p.brand ?? null,
        barcode: p.barcode,
        product_id: p.id ?? null,
        rescue_price: 100,
        retail_price: null,
        quantity_total: 5,
        quantity_remaining: 5,
        allergens_snapshot: p.allergens ?? [],
        is_halal: p.is_halal_hint ?? null,
        image_url_snapshot: p.image_url ?? null,
      },
    ]);
  };

  const removeItem = (idx) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveShelf = async (status) => {
    setErr('');
    if (!pickupStart || !pickupEnd) {
      setErr('Set pickup start and end times.');
      return;
    }
    if (status === 'published' && draftItems.length < 1) {
      setErr('Add at least one item before publishing.');
      return;
    }
    try {
      await upsertShelf({
        pickupStart: new Date(pickupStart).toISOString(),
        pickupEnd: new Date(pickupEnd).toISOString(),
        status,
        items: draftItems,
      });
      router.push('/merchant/shelves');
    } catch (e) {
      setErr(String(e?.message ?? 'Could not save shelf.'));
    }
  };

  if (!isClearanceShelvesEnabled()) {
    return <div className="p-xl">Clearance shelves are disabled.</div>;
  }

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      <div className="flex items-center gap-xl pt-4">
        <Link
          href="/merchant/shelves"
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm"
        >
          <ArrowLeft size={24} weight="bold" />
        </Link>
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
            {outletLabel}
          </p>
          <h1 className="font-display text-h1 text-text">Today&apos;s clearance shelf</h1>
        </div>
      </div>

      <section className="bg-surface rounded-[2rem] p-lg md:p-xl border border-divider shadow-elevation-sm space-y-md">
        <div className="flex items-center gap-sm mb-md">
          <Clock size={22} weight="bold" className="text-text-muted" />
          <h2 className="font-display text-h3 text-text">Pickup window</h2>
        </div>
        <button
          type="button"
          className="px-md py-sm rounded-full border border-primary/30 bg-primary/10 font-label font-bold text-primary text-sm"
          onClick={() => setImmediateWindow(setPickupStart, setPickupEnd)}
        >
          Now (4h window)
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <label className="block space-y-xs">
            <span className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">
              Starts *
            </span>
            <div className="relative">
              <Clock size={18} weight="bold" className="absolute left-4 top-4 text-text-faint pointer-events-none" />
              <input
                type="datetime-local"
                className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner"
                value={pickupStart}
                onChange={(e) => setPickupStart(e.target.value)}
              />
            </div>
          </label>
          <label className="block space-y-xs">
            <span className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">
              Ends *
            </span>
            <div className="relative">
              <Clock size={18} weight="bold" className="absolute left-4 top-4 text-text-faint pointer-events-none" />
              <input
                type="datetime-local"
                className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner"
                value={pickupEnd}
                onChange={(e) => setPickupEnd(e.target.value)}
              />
            </div>
          </label>
        </div>
      </section>

      <section className="bg-surface rounded-[2rem] p-lg md:p-xl border border-divider shadow-elevation-sm space-y-md">
        <div className="flex items-center gap-sm">
          <Package size={22} weight="bold" className="text-text-muted" />
          <h2 className="font-display text-h3 text-text">Items on shelf</h2>
          <span className="ml-auto font-label-caps text-label-caps text-text-muted">
            {draftItems.length} item{draftItems.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex gap-sm">
          <div className="relative flex-1">
            <Barcode size={18} weight="bold" className="absolute left-4 top-4 text-text-faint pointer-events-none" />
            <input
              className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 font-body-md text-text shadow-inner"
              placeholder="Enter barcode"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="px-lg py-3 rounded-2xl bg-primary text-white font-label font-bold disabled:opacity-50"
            disabled={lookupLoading}
            onClick={async () => {
              const p = await lookup(manualBarcode);
              if (p) addProductToDraft(p);
            }}
          >
            {lookupLoading ? 'Looking up…' : 'Lookup'}
          </button>
        </div>

        {product ? (
          <button
            type="button"
            className="text-sm font-label font-bold text-primary"
            onClick={() => addProductToDraft(product)}
          >
            Add {product.name} to shelf
          </button>
        ) : null}

        {draftItems.length === 0 ? (
          <div className="p-xl rounded-2xl border-2 border-dashed border-divider text-center text-text-muted">
            No items yet. Look up a barcode to add clearance items.
          </div>
        ) : (
          <ul className="space-y-sm">
            {draftItems.map((item, idx) => (
              <li
                key={item.id ?? idx}
                className="p-md rounded-2xl border border-divider bg-surface-2 flex items-start justify-between gap-md"
              >
                <div>
                  <p className="font-label font-bold text-text">{item.name_snapshot}</p>
                  {item.brand_snapshot ? (
                    <p className="text-sm text-text-muted">{item.brand_snapshot}</p>
                  ) : null}
                  <p className="text-sm text-accent font-bold mt-xs">
                    LKR {item.rescue_price} · Qty {item.quantity_total}
                  </p>
                  {(item.allergens_snapshot ?? []).length > 0 ? (
                    <p className="text-xs text-text-muted mt-xs">
                      {item.allergens_snapshot.join(', ')}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-sm text-error font-label font-bold"
                  onClick={() => removeItem(idx)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {err ? <p className="font-body-sm text-error">{err}</p> : null}

      <div className="flex flex-col sm:flex-row gap-md">
        <button
          type="button"
          className="flex-1 py-md rounded-2xl border border-divider font-label font-bold text-text disabled:opacity-50"
          disabled={loading}
          onClick={() => void saveShelf('draft')}
        >
          Save draft
        </button>
        <button
          type="button"
          className="flex-1 py-md rounded-2xl bg-primary text-white font-display font-bold flex items-center justify-center gap-sm disabled:opacity-50"
          disabled={loading || draftItems.length < 1}
          onClick={() => void saveShelf('published')}
        >
          <PlusCircle size={22} weight="bold" />
          Publish shelf
        </button>
      </div>
    </main>
  );
}
