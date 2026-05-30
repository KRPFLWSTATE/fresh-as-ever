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
  formatLowStock,
  formatPickupByLabel,
  formatPickupWindow,
  sumRetailSavings,
} from '@/lib/shelfDisplay';
import { formatPickupRangeLabel } from '@/lib/utils';

export default function ClearanceShelfPage() {
  const { id } = useParams();
  const router = useRouter();
  const shelfId = Array.isArray(id) ? id[0] : id;
  const { shelf, loading, error } = useShelfDetail(shelfId);
  const { shelfId: basketShelfId, items, setQuantity } = useClearanceBasket();

  const scopedItems = useMemo(
    () => scopeBasketToShelf(basketShelfId, items, shelfId),
    [basketShelfId, items, shelfId],
  );

  const lineCount = useMemo(
    () => Object.values(scopedItems).reduce((sum, q) => sum + Number(q ?? 0), 0),
    [scopedItems],
  );

  const subtotal = useMemo(() => {
    if (!shelf?.items) return 0;
    return shelf.items.reduce((sum, row) => {
      const qty = scopedItems[row.id] ?? 0;
      return sum + Number(row.rescue_price ?? 0) * qty;
    }, 0);
  }, [scopedItems, shelf]);

  const savingsHint = useMemo(() => {
    if (!shelf?.items) return 0;
    return sumRetailSavings(shelf.items, scopedItems);
  }, [scopedItems, shelf]);

  if (!isClearanceShelvesEnabled()) {
    return (
      <div className="p-xl">
        <p>Clearance shelves are not available.</p>
        <Link href="/discover">Back to discover</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="p-xl">Loading shelf…</div>;
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
  const shelfTitle = shelf.title?.trim() || null;
  const shelfDescription = shelf.description?.trim() || null;
  const shelfCoverUrl = shelf.cover_image_url?.trim() || null;
  const pickup = formatPickupWindow(shelf.pickup_start, shelf.pickup_end);
  const pickupBy = formatPickupByLabel(shelf.pickup_end);
  const notes = typeof shelf.notes === 'string' ? shelf.notes.trim() : '';

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="p-lg border-b border-divider space-y-xs">
        <Link href="/discover" className="text-sm text-primary">
          ← Discover
        </Link>
        <p className="text-xs uppercase tracking-wide text-text-muted">Clearance shelf</p>
        {shelfCoverUrl ? (
          <img
            src={shelfCoverUrl}
            alt=""
            className="w-full h-36 rounded-xl object-cover bg-surface-2 mt-sm"
          />
        ) : null}
        <h1 className="text-2xl font-bold">{shelfTitle ?? outletName}</h1>
        {shelfTitle ? <p className="text-sm text-text-muted">{outletName}</p> : null}
        {shelfDescription ? <p className="text-sm text-text-muted">{shelfDescription}</p> : null}
        <p className="text-sm text-text-muted">
          {pickup.day ? `${pickup.day} · ` : ''}
          Pickup {formatPickupRangeLabel(shelf.pickup_start, shelf.pickup_end)}
        </p>
        {pickupBy ? <p className="text-sm text-accent">{pickupBy}</p> : null}
        {shelf.outlet?.is_halal_certified ? (
          <p className="inline-block text-xs font-semibold px-md py-xs rounded-full bg-primary/10 text-primary">
            Halal-certified outlet
          </p>
        ) : null}
        {notes ? (
          <p className="text-sm text-text-muted p-md rounded-lg bg-surface-2">{notes}</p>
        ) : null}
        <Link href={`/shelves/${shelfId}/allergens`} className="text-sm text-primary">
          Allergens & dietary info →
        </Link>
      </header>

      <ul className="divide-y divide-divider">
        {(shelf.items ?? []).map((item) => {
          const qty = scopedItems[item.id] ?? 0;
          const max = item.quantity_remaining ?? 0;
          const soldOut = item.status === 'sold_out' || max < 1;
          const disabled = soldOut;
          const savingsLine = formatItemSavings(item.retail_price, item.rescue_price);
          const lowStock = !soldOut ? formatLowStock(max) : null;
          const bestBefore = formatBestBefore(item.best_before);
          return (
            <li
              key={item.id}
              className={`p-lg flex gap-md items-center ${soldOut ? 'opacity-55 bg-surface-2' : ''}`}
            >
              {item.image_url_snapshot ? (
                <img
                  src={item.image_url_snapshot}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover bg-surface-2"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface-2" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name_snapshot}</p>
                {item.brand_snapshot ? (
                  <p className="text-sm text-text-muted">{item.brand_snapshot}</p>
                ) : null}
                <p className="text-sm">
                  LKR {Number(item.rescue_price).toFixed(0)}
                  {item.retail_price ? (
                    <span className="line-through text-text-muted ml-2">
                      {Number(item.retail_price).toFixed(0)}
                    </span>
                  ) : null}
                </p>
                {savingsLine ? <p className="text-xs text-secondary">{savingsLine}</p> : null}
                {soldOut ? (
                  <p className="text-xs text-danger font-semibold">Sold out</p>
                ) : lowStock ? (
                  <p className="text-xs text-text-muted">{lowStock}</p>
                ) : null}
                {bestBefore ? <p className="text-xs text-text-muted">{bestBefore}</p> : null}
              </div>
              {!soldOut ? (
                <div className="flex items-center gap-sm">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border"
                    disabled={disabled || qty <= 0}
                    onClick={() => setQuantity(shelf.id, item.id, qty - 1, max)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{qty}</span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border bg-primary text-white"
                    disabled={disabled || qty >= max}
                    onClick={() => setQuantity(shelf.id, item.id, qty + 1, max)}
                  >
                    +
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="fixed bottom-0 inset-x-0 p-lg bg-surface border-t border-divider space-y-xs">
        <p className="text-sm text-text-muted">
          {lineCount} item{lineCount === 1 ? '' : 's'} · LKR {subtotal.toFixed(0)}
          {savingsHint > 0 ? ` · Save LKR ${savingsHint.toFixed(0)}` : ''}
        </p>
        <button
          type="button"
          className="w-full py-md rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
          disabled={lineCount < 1}
          onClick={() => router.push(`/shelves/${shelfId}/review`)}
        >
          Review basket
        </button>
      </div>
    </div>
  );
}
