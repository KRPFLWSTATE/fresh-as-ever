import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVenueRating,
  formatVenueRatingLabel,
  hasVenueRating,
} from '../venueRating.js';

describe('venueRating', () => {
  it('returns null for missing or zero ratings (never 4.2)', () => {
    assert.equal(normalizeVenueRating(null), null);
    assert.equal(normalizeVenueRating(undefined), null);
    assert.equal(normalizeVenueRating(0), null);
    assert.equal(normalizeVenueRating(''), null);
    assert.notEqual(normalizeVenueRating(null), 4.2);
  });

  it('preserves positive ratings', () => {
    assert.equal(normalizeVenueRating(4.5), 4.5);
    assert.equal(normalizeVenueRating('3.8'), 3.8);
  });

  it('formats honest copy when no rating', () => {
    assert.equal(formatVenueRatingLabel(null), 'No reviews yet');
    assert.equal(hasVenueRating(null), false);
    assert.equal(formatVenueRatingLabel(4.7), '4.7');
  });
});
