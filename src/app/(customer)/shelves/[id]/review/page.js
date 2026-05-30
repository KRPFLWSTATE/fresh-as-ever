'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useShelfDetail } from '@/hooks/useShelfDetail';
import { scopeBasketToShelf, useClearanceBasket } from '@/hooks/useClearanceBasket';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';
import {
  formatBestBefore,
  formatItemSavings,
  formatPickupByLabel,
  sumRetailSavings,
} from '@/lib/shelfDisplay';

export default function ShelfReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const shelfId = Array.isArray(id) ? id[0] : id;
  const { shelf, loading, error } = useShelfDetail(shelfId);
  const { shelfId: basketShelfId, items, setQuantity } = useClearanceBasket();

  const scopedItems = useMemo(
    () => scopeBasketToShelf(basketShelfId, items, shelfId),
    [basketShelfId, items, shelfId],
  );

  const lines = useMemo(() => {
    if (!shelf?.items) return [];
    return shelf.items
      .map((row) => {
        const qty = scopedItems[row.id] ?? 0;
        if (qty < 1) return null;
        const max = Number(row.quantity_remaining ?? 0);
        const soldOut = row.status === 'sold_out' || max < 1;
        if (soldOut) return null;
        return { row, id: row.id, qty: Math.min(qty, max) };
      })
      .filter(Boolean);
  }, [scopedItems, shelf]);

  const subtotal = useMemo(
    () => lines.reduce((sum, { row, qty }) => sum + Number(row.rescue_price ?? 0) * qty, 0),
    [lines],
  );

  const savings = useMemo(() => {
    const rows = lines.map(({ row, id, qty }) => ({
      id,
      retail_price: row.retail_price,
      rescue_price: row.rescue_price,
      quantity: qty,
    }));
    return sumRetailSavings(rows, Object.fromEntries(lines.map((l) => [l.id, l.qty])));
  }, [lines]);

  if (!isClearanceShelvesEnabled()) {
    return (
      <div className="p-xl">
        <p>Clearance shelves are not available.</p>
        <Link href="/discover">Back to discover</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="p-xl">Loading review…</div>;
  }

  if (error || !shelf) {
    return (
      <div className="p-xl space-y-md">
        <p>{error || 'Shelf not found.'}</p>
        <Link href="/discover">Back to discover</Link>
      </div>
    );
  }

  const outletName = shelf.outlet?.name ?? shelf.outlet?.merchant?.business_name ?? 'Outlet';
  const pickupBy = formatPickupByLabel(shelf.pickup_end);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="p-lg border-b border-divider space-y-xs">
        <Link href={`/shelves/${shelfId}`} className="text-sm text-primary">
          ← Back to shelf
        </Link>
        <h1 className="text-2xl font-bold">Review shelf</h1>
        <p className="text-sm text-text-muted">{outletName}</p>
        {pickupBy ? <p className="text-sm text-accent">{pickupBy}</p> : null}
      </header>

      <ul className="divide-y divide-divider">
        {lines.map(({ row, id, qty }) => {
          const max = row.quantity_remaining ?? 0;
          const savingsLine = formatItemSavings(row.retail_price, row.rescue_price);
          const bestBefore = formatBestBefore(row.best_before);
          return (
            <li key={id} className="p-lg flex gap-md items-center">
              {row.image_url_snapshot ? (
                <img
                  src={row.image_url_snapshot}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover bg-surface-2"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-2" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{row.name_snapshot}</p>
                {row.brand_snapshot ? (
                  <p className="text-sm text-text-muted">{row.brand_snapshot}</p>
                ) : null}
                <p className="text-sm font-semibold text-accent">
                  LKR {Number(row.rescue_price).toFixed(0)}
                </p>
                {savingsLine ? <p className="text-sm text-secondary">{savingsLine}</p> : null}
                {bestBefore ? <p className="text-xs text-text-muted">{bestBefore}</p> : null}
              </div>
              <div className="flex items-center gap-sm">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border"
                  disabled={qty <= 0}
                  onClick={() => setQuantity(shelf.id, id, qty - 1, max)}
                >
                  −
                </button>
                <span className="w-6 text-center">{qty}</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border bg-primary text-white"
                  disabled={qty >= max}
                  onClick={() => setQuantity(shelf.id, id, qty + 1, max)}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fixed bottom-0 inset-x-0 p-lg bg-surface border-t border-divider space-y-sm">
        <p className="text-sm text-text-muted">
          Subtotal LKR {subtotal.toFixed(0)}
          {savings > 0 ? ` · You save LKR ${savings.toFixed(0)}` : ''}
        </p>
        <button
          type="button"
          className="w-full py-md rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
          disabled={lines.length < 1}
          onClick={() => {
            const payload = lines.map(({ id, qty }) => ({
              shelf_item_id: id,
              quantity: qty,
            }));
            const qs = new URLSearchParams({
              shelf: shelf.id,
              items: JSON.stringify(payload),
            });
            router.push(`/checkout?${qs.toString()}`);
          }}
        >
          Continue to checkout
        </button>
      </div>
    </div>
  );
}
