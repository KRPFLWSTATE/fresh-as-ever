import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapShelfToFeedItem,
  mapBagToFeedItem,
  mergeDiscoverFeed,
  filterDiscoverFeedByListingMode,
} from '../discoverFeed.js';

describe('discoverFeed', () => {
  it('maps shelf with live item count and min price', () => {
    const item = mapShelfToFeedItem({
      id: 's1',
      outlet_id: 'o1',
      pickup_start: '2026-05-25T10:00:00Z',
      pickup_end: '2026-05-25T18:00:00Z',
      outlet: { name: 'Test Mart', category: 'supermarket' },
      items: [
        { status: 'live', quantity_remaining: 2, rescue_price: 150, image_url_snapshot: 'a.jpg' },
        { status: 'live', quantity_remaining: 1, rescue_price: 99 },
        { status: 'sold_out', quantity_remaining: 0, rescue_price: 50 },
      ],
    });
    assert.equal(item.kind, 'shelf');
    assert.equal(item.itemCount, 2);
    assert.equal(item.minPrice, 99);
    assert.deepEqual(item.thumbnails, ['a.jpg']);
  });

  it('merges bags and shelves sorted by pickup_start', () => {
    const prevFlag = process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED;
    process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED = 'true';
    try {
    const feed = mergeDiscoverFeed(
      [{ id: 'b1', pickup_start: '2026-05-25T12:00:00Z', outlet_category: 'bakery' }],
      [
        {
          id: 's1',
          pickup_start: '2026-05-25T08:00:00Z',
          items: [{ status: 'live', quantity_remaining: 1, rescue_price: 10 }],
          outlet: { category: 'hybrid' },
        },
      ],
    );
    assert.deepEqual(feed.map((f) => f.id), ['s1', 'b1']);
    } finally {
      if (prevFlag === undefined) delete process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED;
      else process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED = prevFlag;
    }
  });

  it('maps bag feed item', () => {
    const bag = mapBagToFeedItem({ id: 'b2', title: 'Bakery' });
    assert.equal(bag.kind, 'bag');
    assert.equal(bag.id, 'b2');
  });

  it('filters supermarket bags from discover feed', () => {
    const prevFlag = process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED;
    process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED = 'true';
    try {
      const feed = filterDiscoverFeedByListingMode([
        mapBagToFeedItem({ id: 'b1', outlet_category: 'supermarket', title: 'X' }),
        mapShelfToFeedItem({
          id: 's1',
          outlet: { category: 'supermarket' },
          items: [{ status: 'live', quantity_remaining: 1, rescue_price: 10 }],
        }),
      ]);
      assert.deepEqual(feed.map((f) => f.id), ['s1']);
    } finally {
      if (prevFlag === undefined) delete process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED;
      else process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED = prevFlag;
    }
  });
});
