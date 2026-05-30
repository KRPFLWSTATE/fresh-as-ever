import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sumSurplusRecovered } from '../merchantAnalytics.js';

describe('sumSurplusRecovered', () => {
  it('skips null and zero retail', () => {
    assert.equal(
      sumSurplusRecovered([
        { quantity: 1, bag: { retail_value_estimate: 400 } },
        { quantity: 1, bag: { retail_value_estimate: null } },
      ]),
      400,
    );
  });

  it('multiplies by quantity', () => {
    assert.equal(
      sumSurplusRecovered([{ quantity: 2, bag: { retail_value_estimate: 250 } }]),
      500,
    );
  });
});
