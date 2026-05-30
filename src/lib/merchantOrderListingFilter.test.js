import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterOrdersForListingMode,
  orderMatchesOutletListingMode,
  buildOutletModeById,
} from './merchantOrderListingFilter.js';
import { outletListingMode } from './outletListingMode.js';

describe('merchantOrderListingFilter (web)', () => {
  const orders = [
    { id: '1', outlet_id: 'a', shelf_id: 's1' },
    { id: '2', outlet_id: 'a', shelf_id: null },
    { id: '3', outlet_id: 'b', shelf_id: null },
  ];

  it('filters shelf orders for clearance_shelf outlets', () => {
    assert.deepEqual(filterOrdersForListingMode(orders, 'clearance_shelf'), [
      { id: '1', outlet_id: 'a', shelf_id: 's1' },
    ]);
  });

  it('matches per-outlet mode', () => {
    const map = buildOutletModeById([
      { id: 'a', category: 'supermarket' },
      { id: 'b', category: 'bakery' },
    ]);
    assert.equal(orderMatchesOutletListingMode(orders[0], map), true);
    assert.equal(orderMatchesOutletListingMode(orders[1], map), false);
    assert.equal(orderMatchesOutletListingMode(orders[2], map), true);
    assert.equal(outletListingMode('supermarket'), 'clearance_shelf');
  });
});
