/** Customer-facing order title and pickup source for bag vs clearance shelf orders. */

export function orderListingKind(order) {
  return order?.shelf_id ? 'shelf' : 'bag';
}

export function orderDisplayTitle(order) {
  if (order?.shelf_id) {
    const items = order?.order_items ?? [];
    const lines = items.length;
    if (lines === 1 && items[0]?.name_snapshot) {
      return String(items[0].name_snapshot);
    }
    return lines > 0
      ? `Clearance shelf · ${lines} item${lines === 1 ? '' : 's'}`
      : 'Clearance shelf order';
  }
  return order?.bag?.title || 'Rescue bag';
}

export function orderPickupWindow(order) {
  if (order?.shelf_id) {
    return {
      start: order?.shelf?.pickup_start ?? order?.pickup_start,
      end: order?.shelf?.pickup_end ?? order?.pickup_end,
    };
  }
  return {
    start: order?.bag?.pickup_start,
    end: order?.bag?.pickup_end,
  };
}
