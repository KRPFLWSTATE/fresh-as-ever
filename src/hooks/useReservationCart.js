'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'fae.reservationCart.v1';
export const MAX_GROUP_BAGS = 5;

const EMPTY = { outletId: null, bagIds: [], bags: [] };

function readCart() {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.bagIds)) return EMPTY;
    return {
      outletId: parsed.outletId ?? null,
      bagIds: parsed.bagIds.slice(0, MAX_GROUP_BAGS),
      bags: Array.isArray(parsed.bags) ? parsed.bags.slice(0, MAX_GROUP_BAGS) : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeCart(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(state));
}

export function useReservationCart() {
  const [cart, setCart] = useState(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(readCart());
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setCart(next);
    writeCart(next);
  }, []);

  const addBag = useCallback(
    (bag, options) => {
      const current = readCart();
      if (current.outletId && current.outletId !== bag.outletId && !options?.replaceOutlet) {
        return { error: 'different_outlet' };
      }
      if (current.bagIds.includes(bag.id)) {
        return { ok: true };
      }
      if (current.bagIds.length >= MAX_GROUP_BAGS) {
        return { error: 'cart_full' };
      }
      const next = {
        outletId: bag.outletId,
        bagIds: [...current.bagIds, bag.id],
        bags: [...current.bags, bag],
      };
      persist(next);
      return { ok: true };
    },
    [persist],
  );

  const removeBag = useCallback(
    (bagId) => {
      const current = readCart();
      const bagIds = current.bagIds.filter((id) => id !== bagId);
      const bags = current.bags.filter((b) => b.id !== bagId);
      persist({
        outletId: bagIds.length ? current.outletId : null,
        bagIds,
        bags,
      });
    },
    [persist],
  );

  const clear = useCallback(() => {
    persist(EMPTY);
  }, [persist]);

  const replaceOutletCart = useCallback(
    (bag) => {
      persist({ outletId: bag.outletId, bagIds: [bag.id], bags: [bag] });
      return { ok: true };
    },
    [persist],
  );

  return useMemo(
    () => ({
      cart,
      ready,
      count: cart.bagIds.length,
      addBag,
      removeBag,
      clear,
      replaceOutletCart,
      isInCart: (bagId) => cart.bagIds.includes(bagId),
    }),
    [cart, ready, addBag, removeBag, clear, replaceOutletCart],
  );
}
