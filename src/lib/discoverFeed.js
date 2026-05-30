import { isClearanceShelvesEnabled } from './clearanceShelves.js';
import { canPublishClearanceShelves, canPublishRescueBags } from './outletListingMode.js';
import { calcItemSavingsPercent } from './shelfDisplay.js';

export function mapShelfToFeedItem(shelf) {
  const items = shelf.items ?? shelf.clearance_shelf_items ?? [];
  const liveItems = items.filter((i) => i.status === 'live' && (i.quantity_remaining ?? 0) > 0);
  const thumbs = liveItems
    .slice(0, 3)
    .map((i) => i.image_url_snapshot)
    .filter(Boolean);
  const minPrice = liveItems.reduce(
    (min, i) => Math.min(min, Number(i.rescue_price ?? Infinity)),
    Infinity,
  );
  const previewItemNames = liveItems
    .slice(0, 3)
    .map((i) => String(i.name_snapshot ?? '').trim())
    .filter((n) => n.length > 0);
  const savingsPercents = liveItems
    .map((i) => calcItemSavingsPercent(i.retail_price, i.rescue_price))
    .filter((p) => p > 0);
  const savingsPercentMin =
    savingsPercents.length > 0 ? Math.min(...savingsPercents) : undefined;
  const savingsPercentMax =
    savingsPercents.length > 0 ? Math.max(...savingsPercents) : undefined;
  const outlet = shelf.outlet ?? {};
  return {
    kind: 'shelf',
    id: shelf.id,
    itemCount: liveItems.length,
    thumbnails: thumbs,
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    pickup_start: shelf.pickup_start,
    pickup_end: shelf.pickup_end,
    outlet_id: shelf.outlet_id,
    outlet_name: outlet.name ?? outlet.business_name,
    outlet_lat: outlet.lat,
    outlet_lng: outlet.lng,
    category: outlet.category,
    merchant_name: outlet.merchant?.business_name,
    trust_score: outlet.trust_score,
    previewItemNames,
    savingsPercentMin,
    savingsPercentMax,
    payload: shelf,
  };
}

export function mapBagToFeedItem(bag) {
  const outlet = bag.outlet ?? {};
  return {
    kind: 'bag',
    id: bag.id,
    payload: bag,
    outlet_category: bag.outlet_category ?? outlet.category ?? null,
    ...bag,
  };
}

export async function fetchPublishedShelves(supabase) {
  if (!isClearanceShelvesEnabled()) return [];
  const { data, error } = await supabase
    .from('clearance_shelves')
    .select(`
      id,
      outlet_id,
      pickup_start,
      pickup_end,
      status,
      items:clearance_shelf_items (
        id, status, quantity_remaining, rescue_price, retail_price,
        name_snapshot, brand_snapshot, product_id,
        image_url_snapshot, allergens_snapshot, is_halal
      ),
      outlet:outlets (
        id, name, category, location,
        trust_score, average_rating, total_reviews,
        merchant:merchants (business_name)
      )
    `)
    .eq('status', 'published')
    .gt('pickup_end', new Date().toISOString());
  if (error) {
    console.warn('fetchPublishedShelves', error.message);
    return [];
  }
  return (data ?? []).filter((s) => (s.items ?? []).some((i) => i.status === 'live' && i.quantity_remaining > 0));
}

export function mergeDiscoverFeed(bags, shelves) {
  const bagItems = (bags ?? []).map(mapBagToFeedItem);
  const shelfItems = (shelves ?? []).map(mapShelfToFeedItem);
  return filterDiscoverFeedByListingMode([...bagItems, ...shelfItems]).sort((a, b) => {
    const aStart = a.pickup_start ?? a.payload?.pickup_start ?? '';
    const bStart = b.pickup_start ?? b.payload?.pickup_start ?? '';
    return String(aStart).localeCompare(String(bStart));
  });
}

function feedItemOutletCategory(item) {
  if (item.kind === 'shelf') {
    return String(item.category ?? '');
  }
  const payload = item.payload ?? {};
  const outlet = payload.outlet ?? {};
  return String(item.outlet_category ?? payload.outlet_category ?? outlet.category ?? '');
}

export function filterDiscoverFeedByListingMode(items) {
  const clearanceOn = isClearanceShelvesEnabled();
  return items.filter((item) => {
    const outletCategory = feedItemOutletCategory(item);
    if (item.kind === 'shelf') {
      return clearanceOn && canPublishClearanceShelves(outletCategory);
    }
    return canPublishRescueBags(outletCategory);
  });
}
