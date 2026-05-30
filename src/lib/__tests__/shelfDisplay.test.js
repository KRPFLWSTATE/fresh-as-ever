import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcItemSavingsPercent,
  formatItemSavings,
  formatLowStock,
  formatUnitLabel,
  sumRetailSavingsForItems,
} from '../shelfDisplay.js';

describe('shelfDisplay', () => {
  it('formatItemSavings returns percent string', () => {
    assert.equal(formatItemSavings(1000, 600), 'Save 40%');
    assert.equal(formatItemSavings(null, 600), null);
  });

  it('calcItemSavingsPercent rounds', () => {
    assert.equal(calcItemSavingsPercent(799, 499), 38);
  });

  it('formatUnitLabel appends weight', () => {
    assert.equal(formatUnitLabel({ name: 'Yoghurt', weight_grams: 500 }), 'Yoghurt · 500g');
    assert.equal(formatUnitLabel({ name: 'Rice', weight_grams: 1000 }), 'Rice · 1kg');
  });

  it('formatLowStock threshold', () => {
    assert.equal(formatLowStock(2), 'Only 2 left');
    assert.equal(formatLowStock(10), null);
  });

  it('sumRetailSavingsForItems aggregates qty map', () => {
    const items = [
      { id: 'a', retail_price: 1000, rescue_price: 700 },
      { id: 'b', retail_price: 500, rescue_price: 400 },
    ];
    assert.equal(sumRetailSavingsForItems(items, { a: 2, b: 1 }), 700);
  });
});
