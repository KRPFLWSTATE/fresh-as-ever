import { normalizeOrderStatus, ACTIVE_ORDER_STATUSES, isOrderCollectible } from '@/lib/utils';
import {
  isApproachingWithin2h,
  isLatePickup,
  isNoShowGraceElapsed,
  isPickupWindowOpen,
  lateSeverityFromMinutes,
  minutesPastPickupEnd,
} from '@/lib/pickupWindow';

const ACTIVE_SET = new Set([...ACTIVE_ORDER_STATUSES, 'awaiting_pickup']);

export function isActiveMerchantOrder(normalizedStatus) {
  return ACTIVE_SET.has(normalizedStatus);
}

export function filterOrdersByView(rows, view, nowMs = Date.now()) {
  if (view === 'all') {
    return rows.filter((o) => isActiveMerchantOrder(normalizeOrderStatus(o.status)));
  }

  return rows.filter((order) => {
    const st = normalizeOrderStatus(order.status);
    if (!isActiveMerchantOrder(st)) return false;

    if (view === 'live-monitor') {
      return isApproachingWithin2h(nowMs, order.pickup_end);
    }

    if (view === 'verification') {
      return (
        isPickupWindowOpen(nowMs, order.pickup_start, order.pickup_end) &&
        isOrderCollectible(order)
      );
    }

    if (view === 'review-pending') {
      if (isLatePickup(nowMs, order.pickup_end)) return false;
      if (isApproachingWithin2h(nowMs, order.pickup_end)) return false;
      if (isPickupWindowOpen(nowMs, order.pickup_start, order.pickup_end) && isOrderCollectible(order)) {
        return false;
      }
      if (st === 'reserved' && order.payment_status !== 'paid') return true;
      const start = order.pickup_start ? new Date(order.pickup_start).getTime() : null;
      if (isOrderCollectible(order) && start != null && !Number.isNaN(start) && nowMs < start) {
        return true;
      }
      return false;
    }

    if (view === 'late-pickups') {
      return isLatePickup(nowMs, order.pickup_end);
    }

    return true;
  });
}

export function countOrdersForView(rows, view, nowMs = Date.now()) {
  return filterOrdersByView(rows, view, nowMs).length;
}

export function sortLateOrders(rows, nowMs = Date.now()) {
  const severityRank = { critical: 0, moderate: 1, recent: 2 };
  return [...rows].sort((a, b) => {
    const ma = minutesPastPickupEnd(nowMs, a.pickup_end);
    const mb = minutesPastPickupEnd(nowMs, b.pickup_end);
    const sa = lateSeverityFromMinutes(ma) ?? 'recent';
    const sb = lateSeverityFromMinutes(mb) ?? 'recent';
    const dr = (severityRank[sa] ?? 9) - (severityRank[sb] ?? 9);
    if (dr !== 0) return dr;
    return mb - ma;
  });
}

export function filterLateBySeverity(rows, chip, nowMs = Date.now()) {
  if (chip === 'all') return rows;
  return rows.filter((o) => {
    const sev = lateSeverityFromMinutes(minutesPastPickupEnd(nowMs, o.pickup_end));
    return sev === chip;
  });
}

export function lateSeverityCounts(rows, nowMs = Date.now()) {
  let critical = 0;
  let moderate = 0;
  let recent = 0;
  for (const o of rows) {
    const sev = lateSeverityFromMinutes(minutesPastPickupEnd(nowMs, o.pickup_end));
    if (sev === 'critical') critical += 1;
    else if (sev === 'moderate') moderate += 1;
    else if (sev === 'recent') recent += 1;
  }
  return { critical, moderate, recent, total: rows.length };
}

export function isNoShowEligible(order, nowMs = Date.now()) {
  if (!isOrderCollectible(order)) return false;
  return isNoShowGraceElapsed(order.pickup_end, nowMs);
}

export function isLateHandoverEligible(order) {
  return isOrderCollectible(order);
}
