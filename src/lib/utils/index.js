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

/**
 * Format a distance in km
 * @param {number} km 
 * @returns {string} e.g. "1.2 km" or "500 m"
 */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
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
  awaiting_pickup: { label: 'Awaiting Pickup', color: 'accent' },
  paid: { label: 'Paid', color: 'primary' },
  collected: { label: 'Collected', color: 'success' },
  no_show: { label: 'No Show', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'neutral' },
  refunded: { label: 'Refunded', color: 'neutral' },
  disputed: { label: 'Disputed', color: 'warning' },
  resolved: { label: 'Resolved', color: 'success' },
};

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
