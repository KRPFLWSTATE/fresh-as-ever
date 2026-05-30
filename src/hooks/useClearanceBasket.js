'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'fae.clearanceBasket.v1';

/** Drop basket lines when viewing a different shelf (parity with mobile). */
export function scopeBasketToShelf(basketShelfId, items, targetShelfId) {
  if (!basketShelfId || !targetShelfId || basketShelfId !== targetShelfId) {
    return {};
  }
  return items ?? {};
}

function readStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorage(payload) {
  if (typeof window === 'undefined') return;
  if (!payload?.shelfId || !payload.items || Object.keys(payload.items).length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function useClearanceBasket() {
  const [shelfId, setShelfId] = useState(null);
  const [items, setItems] = useState({});

  useEffect(() => {
    const stored = readStorage();
    if (stored?.shelfId) {
      setShelfId(stored.shelfId);
      setItems(stored.items ?? {});
    }
  }, []);

  const persist = useCallback((nextShelfId, nextItems) => {
    setShelfId(nextShelfId);
    setItems(nextItems);
    writeStorage({ shelfId: nextShelfId, items: nextItems });
  }, []);

  const setQuantity = useCallback(
    (targetShelfId, shelfItemId, quantity, maxRemaining) => {
      const qty = Math.max(0, Math.min(quantity, maxRemaining ?? quantity));
      setItems((prev) => {
        let baseShelf = shelfId;
        let next = { ...prev };
        if (baseShelf && baseShelf !== targetShelfId) {
          next = {};
          baseShelf = targetShelfId;
        } else if (!baseShelf) {
          baseShelf = targetShelfId;
        }
        if (qty <= 0) {
          delete next[shelfItemId];
        } else {
          next[shelfItemId] = qty;
        }
        persist(baseShelf, next);
        return next;
      });
    },
    [persist, shelfId],
  );

  const clear = useCallback(() => {
    persist(null, {});
  }, [persist]);

  const lineCount = useMemo(
    () => Object.values(items).reduce((sum, q) => sum + Number(q ?? 0), 0),
    [items],
  );

  const payloadItems = useMemo(
    () =>
      Object.entries(items)
        .filter(([, q]) => Number(q) > 0)
        .map(([shelfItemId, quantity]) => ({ shelf_item_id: shelfItemId, quantity: Number(quantity) })),
    [items],
  );

  return {
    shelfId,
    items,
    lineCount,
    payloadItems,
    setQuantity,
    clear,
  };
}
