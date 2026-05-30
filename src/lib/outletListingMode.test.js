import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  outletListingMode,
  canPublishClearanceShelves,
  canPublishRescueBags,
} from './outletListingMode.js';

describe('outletListingMode', () => {
  it('maps supermarket to clearance_shelf', () => {
    assert.equal(outletListingMode('supermarket'), 'clearance_shelf');
    assert.equal(canPublishClearanceShelves('supermarket'), true);
    assert.equal(canPublishRescueBags('supermarket'), false);
  });

  it('maps hotel to hybrid', () => {
    assert.equal(outletListingMode('hotel'), 'hybrid');
    assert.equal(canPublishClearanceShelves('hotel'), true);
    assert.equal(canPublishRescueBags('hotel'), true);
  });

  it('maps bakery to rescue_bag', () => {
    assert.equal(outletListingMode('bakery'), 'rescue_bag');
    assert.equal(canPublishClearanceShelves('bakery'), false);
  });

  it('maps hybrid to dual mode', () => {
    assert.equal(outletListingMode('hybrid'), 'hybrid');
    assert.equal(canPublishClearanceShelves('hybrid'), true);
    assert.equal(canPublishRescueBags('hybrid'), true);
  });
});
