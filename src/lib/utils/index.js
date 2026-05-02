/**
 * Format a number as Sri Lankan Rupees (LKR)
 * @param {number} amount 
 * @returns {string} Formatted amount e.g. "LKR 800.00"
 */
export function formatLKR(amount) {
  if (amount == null || isNaN(amount)) return 'LKR 0.00';
  return `LKR ${Number(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate savings percentage
 * @param {number} retailValue 
 * @param {number} rescuePrice 
 * @returns {number} Percentage saved (0-100)
 */
export function calcSavings(retailValue, rescuePrice) {
  if (!retailValue || retailValue <= 0) return 0;
  return Math.round(((retailValue - rescuePrice) / retailValue) * 100);
}

/**
 * Generate a random 6-character alphanumeric reservation code
 * @returns {string} e.g. "A3B7K9"
 */
export function generateReservationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get relative time string (e.g. "2h left", "30m left", "Closed")
 * @param {string|Date} endTime 
 * @returns {string}
 */
export function getTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;

  if (diff <= 0) return 'Closed';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/**
 * Format a pickup time window (e.g. "5:00 PM – 7:00 PM")
 * @param {string|Date} start 
 * @param {string|Date} end 
 * @returns {string}
 */
export function formatPickupWindow(start, end) {
  const fmt = (d) => new Date(d).toLocaleTimeString('en-LK', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** UUID-shaped route ids (includes non-RFC seeded ids, e.g. all-zero version nibble). */
const ORDER_ID_UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOrderIdUuidShape(value) {
  return ORDER_ID_UUID_SHAPE.test(String(value || '').trim());
}

/**
 * Human-readable pickup line for lists and cards: date + time range when parseable as ISO timestamps.
 * @param {string|Date|null|undefined} start
 * @param {string|Date|null|undefined} end
 * @returns {string}
 */
export function formatPickupRangeLabel(start, end) {
  if (start == null && end == null) return '';
  const s = start != null ? new Date(start) : null;
  const e = end != null ? new Date(end) : null;
  const sOk = s && !Number.isNaN(s.getTime());
  const eOk = e && !Number.isNaN(e.getTime());
  if (sOk && eOk) {
    const sameDay =
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth() &&
      s.getDate() === e.getDate();
    const weekday = s.toLocaleDateString('en-LK', { weekday: 'short' });
    const dayPart = s.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
    const dateLine = sameDay ? `${weekday}, ${dayPart}` : `${weekday}, ${dayPart} – ${e.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })}`;
    return `${dateLine} · ${formatPickupWindow(s, e)}`;
  }
  const left = String(start ?? '').trim();
  const right = String(end ?? '').trim();
  if (left && right) return `${left} – ${right}`;
  return left || right || '';
}

/**
 * Format a distance in km
 * @param {number} km 
 * @returns {string} e.g. "1.2 km" or "500 m"
 */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two points in kilometers.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * e.g. "1.2 km away"; returns null when coordinates are unusable.
 */
export function formatDistanceAwayLabel(userLat, userLng, outletLat, outletLng) {
  const uLat = typeof userLat === 'number' ? userLat : parseFloat(userLat);
  const uLng = typeof userLng === 'number' ? userLng : parseFloat(userLng);
  const oLat = typeof outletLat === 'number' ? outletLat : parseFloat(outletLat);
  const oLng = typeof outletLng === 'number' ? outletLng : parseFloat(outletLng);
  if (![uLat, uLng, oLat, oLng].every(Number.isFinite)) return null;
  const km = haversineKm(uLat, uLng, oLat, oLng);
  return `${formatDistance(km)} away`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncate(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Get initials from a name (for avatar fallback)
 * @param {string} name 
 * @returns {string} e.g. "KP"
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Category display data
 */
export const CATEGORIES = {
  bakery: { label: 'Bakery', emoji: '🥐' },
  cafe: { label: 'Café', emoji: '☕' },
  restaurant: { label: 'Restaurant', emoji: '🍛' },
  supermarket: { label: 'Supermarket', emoji: '🛒' },
  hotel: { label: 'Hotel', emoji: '🏨' },
  mixed_meals: { label: 'Mixed Meals', emoji: '🍱' },
  groceries: { label: 'Groceries', emoji: '🥬' },
  other: { label: 'Other', emoji: '🍽️' },
};

/**
 * Order status display data
 */
export const ORDER_STATUSES = {
  reserved: { label: 'Reserved', color: 'primary' },
  paid: { label: 'Paid', color: 'primary' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'accent' },
  collected: { label: 'Collected', color: 'success' },
  no_show: { label: 'No Show', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'neutral' },
  refunded: { label: 'Refunded', color: 'neutral' },
  disputed: { label: 'Disputed', color: 'warning' },
  resolved: { label: 'Resolved', color: 'success' },
};

export const ORDER_STATUS_ALIASES = {
  awaiting_pickup: 'ready_for_pickup',
  confirmed: 'paid',
  preparing: 'paid',
};

export const ACTIVE_ORDER_STATUSES = ['reserved', 'paid', 'ready_for_pickup'];
export const PAST_ORDER_STATUSES = ['collected', 'cancelled', 'no_show', 'refunded', 'disputed', 'resolved'];

export function normalizeOrderStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  return ORDER_STATUS_ALIASES[value] || value || 'reserved';
}

export function isActiveOrderStatus(status) {
  return ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(status));
}

export function isPastOrderStatus(status) {
  return PAST_ORDER_STATUSES.includes(normalizeOrderStatus(status));
}

/** 30-minute grace after bag pickup_end before merchant may mark no-show */
export const NO_SHOW_GRACE_MS = 30 * 60 * 1000;

const NO_SHOW_MERCHANT_STATUSES = ['paid', 'ready_for_pickup', 'awaiting_pickup'];

/** Whether pickup window grace has passed for no-show tooling (client mirrors DB rule). */
export function isPickupNoShowGraceElapsed(pickupEndIso) {
  if (pickupEndIso == null) return false;
  const end = new Date(pickupEndIso).getTime();
  if (Number.isNaN(end)) return false;
  return Date.now() >= end + NO_SHOW_GRACE_MS;
}

export function isOrderEligibleForMerchantNoShow(normalizedStatus, pickupEndIso) {
  const s = normalizeOrderStatus(normalizedStatus);
  return NO_SHOW_MERCHANT_STATUSES.includes(s) && isPickupNoShowGraceElapsed(pickupEndIso);
}

/**
 * Bag status display data
 */
export const BAG_STATUSES = {
  draft: { label: 'Draft', color: 'neutral' },
  live: { label: 'Live', color: 'success' },
  sold_out: { label: 'Sold Out', color: 'accent' },
  expired: { label: 'Expired', color: 'neutral' },
  paused: { label: 'Paused', color: 'warning' },
  removed: { label: 'Removed', color: 'error' },
};
