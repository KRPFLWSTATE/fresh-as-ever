import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeOutletTrustScore, formatTrustScoreLabel } from '../outletTrust.js';

describe('outletTrust', () => {
  it('returns null when order window is below minimum', () => {
    assert.equal(
      computeOutletTrustScore({
        trustOrdersWindow: 2,
        averageRating: 5,
      }),
      null,
    );
  });

  it('computes trust within 0-5', () => {
    const score = computeOutletTrustScore({
      trustOrdersWindow: 20,
      averageRating: 4.5,
      collectionRatePct: 95,
      complaintRatePct: 0,
      noShowRatePct: 0,
    });
    assert.ok(score !== null && score >= 0 && score <= 5);
  });

  it('formats labels', () => {
    assert.equal(formatTrustScoreLabel(null), 'New outlet');
  });
});
