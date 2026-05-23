/**
 * Honest venue rating helpers — never invent a default like 4.2.
 */

/** @param {unknown} value */
export function normalizeVenueRating(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

/** @param {number | null | undefined} rating */
export function formatVenueRatingLabel(rating) {
  if (rating == null) return 'No reviews yet';
  return Number(rating).toFixed(1);
}

/** @param {number | null | undefined} rating */
export function hasVenueRating(rating) {
  return normalizeVenueRating(rating) != null;
}
