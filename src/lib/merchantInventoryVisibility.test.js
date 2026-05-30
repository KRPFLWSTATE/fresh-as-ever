import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  merchantInventoryVisibility,
  pickMerchantInventoryListKind,
} from './merchantInventoryVisibility.js';

describe('merchantInventoryVisibility (web)', () => {
  it('supermarket shows shelves without requiring clearance flag for merchant UI', () => {
    const prev = process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED;
    process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED = 'false';
    try {
      const v = merchantInventoryVisibility('supermarket');
      assert.equal(v.showBags, false);
      assert.equal(v.showShelves, true);
      assert.equal(v.clearanceOn, false);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED;
      else process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED = prev;
    }
  });

  it('pickMerchantInventoryListKind matches mobile routing', () => {
    assert.equal(pickMerchantInventoryListKind('supermarket'), 'shelves');
    assert.equal(pickMerchantInventoryListKind('bakery'), 'bags');
    assert.equal(pickMerchantInventoryListKind('hybrid'), 'none');
  });
});
