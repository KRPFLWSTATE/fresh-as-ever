import { orderListingKind } from './orderDisplay.js';
import { outletListingMode } from './outletListingMode.js';

/** Restrict merchant order lists to the product types an outlet publishes. */
export function filterOrdersForListingMode(orders, mode) {
  if (mode === 'clearance_shelf') {
    return orders.filter((o) => orderListingKind(o) === 'shelf');
  }
  if (mode === 'rescue_bag') {
    return orders.filter((o) => orderListingKind(o) === 'bag');
  }
  return orders;
}

/** Build outlet_id → listing mode map from merchant context outlets. */
export function buildOutletModeById(outlets) {
  const map = new Map();
  for (const outlet of outlets ?? []) {
    map.set(String(outlet.id), outletListingMode(outlet.category));
  }
  return map;
}

export function orderMatchesOutletListingMode(row, outletModeById) {
  const outletId = String(row.outlet_id ?? '');
  const mode = outletModeById.get(outletId) ?? 'rescue_bag';
  return filterOrdersForListingMode([row], mode).length > 0;
}
