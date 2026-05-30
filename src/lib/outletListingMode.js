/**
 * Outlet category → listing mode for Rescue Bag vs Clearance Shelf.
 * Legacy `hotel` rows stay hybrid; new outlets use café (bags) or supermarket (shelves).
 */
export const MERCHANT_OUTLET_CATEGORIES = [
  { value: 'bakery', label: 'Bakery' },
  { value: 'cafe', label: 'Café' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'hybrid', label: 'Bags & shelves' },
  { value: 'other', label: 'Other' },
];

export function outletListingMode(category) {
  const c = String(category ?? '').trim().toLowerCase();
  if (c === 'supermarket' || c === 'grocery' || c === 'groceries') {
    return 'clearance_shelf';
  }
  // Dual mode: explicit hybrid or legacy hotel rows.
  if (c === 'hybrid' || c === 'hotel') {
    return 'hybrid';
  }
  return 'rescue_bag';
}

export function canPublishRescueBags(category) {
  const mode = outletListingMode(category);
  return mode === 'rescue_bag' || mode === 'hybrid';
}

export function canPublishClearanceShelves(category) {
  const mode = outletListingMode(category);
  return mode === 'clearance_shelf' || mode === 'hybrid';
}
