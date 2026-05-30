'use client';

import Link from 'next/link';
import { ShoppingCart, X } from '@phosphor-icons/react';
import { useReservationCart } from '@/hooks/useReservationCart';
import { useClearanceBasket } from '@/hooks/useClearanceBasket';
import { isGroupReservationsEnabled } from '@/lib/groupReservations';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';

export function ReservationCartBar() {
  const enabled = isGroupReservationsEnabled();
  const cart = useReservationCart();
  const shelfBasket = useClearanceBasket();
  const shelfLines = isClearanceShelvesEnabled() ? shelfBasket.lineCount : 0;

  if (shelfLines > 0 && cart.count > 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-500/40 bg-amber-50/95 p-4 text-center text-sm text-amber-900">
        Finish your clearance shelf checkout or clear your group bag cart — you cannot mix both.
      </div>
    );
  }

  if (!enabled || !cart.ready || cart.count === 0) {
    return null;
  }

  const total = cart.cart.bags.reduce(
    (sum, b) => sum + Number(b.rescuePrice ?? b.rescue_price ?? 0),
    0,
  );
  const checkoutHref = `/checkout?group=${cart.cart.bagIds.join(',')}&draft=${cart.cart.bagIds[0] ?? ''}`;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-divider bg-surface/95 backdrop-blur-xl shadow-elevation-lg pb-safe"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-page-margin-mobile py-4 md:px-page-margin-desktop">
        <div className="min-w-0 flex-1">
          <p className="font-label text-xs font-bold uppercase tracking-wider text-text-muted">
            Group order
          </p>
          <p className="font-body-md font-semibold text-text truncate">
            {cart.count} bag{cart.count === 1 ? '' : 's'} · LKR {Math.round(total).toLocaleString('en-LK')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => cart.clear()}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-divider bg-surface-2 text-text-muted hover:bg-surface-2"
            aria-label="Clear group cart"
          >
            <X size={20} weight="bold" />
          </button>
          <Link
            href={checkoutHref}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-label font-bold text-white shadow-elevation-md hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={20} weight="fill" />
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
