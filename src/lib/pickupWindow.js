/** Pickup window helpers — single source for merchant order views and late pickups. */

export const NO_SHOW_GRACE_MS = 30 * 60 * 1000;

/** Matches `customer_signal_arrival` RPC — 15 minutes before pickup_start. */
export const CUSTOMER_ARRIVAL_EARLY_MS = 15 * 60 * 1000;

export function parsePickupMs(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

export function isPickupWindowOpen(nowMs, pickupStartIso, pickupEndIso) {
  const end = parsePickupMs(pickupEndIso);
  if (end == null) return false;
  const start = parsePickupMs(pickupStartIso);
  if (start != null && nowMs < start) return false;
  return nowMs <= end;
}

export function isCustomerArrivalEligible(nowMs, pickupStartIso, pickupEndIso) {
  const end = parsePickupMs(pickupEndIso);
  if (end == null || nowMs > end) return false;
  const start = parsePickupMs(pickupStartIso);
  if (start != null && nowMs < start - CUSTOMER_ARRIVAL_EARLY_MS) return false;
  return true;
}

export function isApproachingWithin2h(nowMs, pickupEndIso) {
  const end = parsePickupMs(pickupEndIso);
  if (end == null) return false;
  const horizon = nowMs + 2 * 60 * 60 * 1000;
  return end > nowMs && end <= horizon;
}

export function isLatePickup(nowMs, pickupEndIso) {
  const end = parsePickupMs(pickupEndIso);
  if (end == null) return false;
  return nowMs > end;
}

export function minutesPastPickupEnd(nowMs, pickupEndIso) {
  const end = parsePickupMs(pickupEndIso);
  if (end == null || nowMs <= end) return 0;
  return Math.floor((nowMs - end) / 60_000);
}

export function lateSeverityFromMinutes(minutesLate) {
  if (minutesLate <= 0) return null;
  if (minutesLate >= 30) return 'critical';
  if (minutesLate >= 15) return 'moderate';
  return 'recent';
}

export function isNoShowGraceElapsed(pickupEndIso, nowMs = Date.now()) {
  const end = parsePickupMs(pickupEndIso);
  if (end == null) return false;
  return nowMs >= end + NO_SHOW_GRACE_MS;
}

export function msUntilNoShowEligible(pickupEndIso, nowMs = Date.now()) {
  const end = parsePickupMs(pickupEndIso);
  if (end == null) return 0;
  return Math.max(0, end + NO_SHOW_GRACE_MS - nowMs);
}

const PICKUP_TBC = 'Pickup time TBC';

/** Human-readable pickup window for celebration and order detail surfaces. */
export function formatPickupLine(startIso, endIso) {
  if (!startIso || !endIso) return PICKUP_TBC;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return PICKUP_TBC;
  }
  const tf = { hour: 'numeric', minute: '2-digit' };
  const today = new Date();
  const dayPrefix =
    start.toDateString() === today.toDateString()
      ? 'Today'
      : start.toLocaleDateString(undefined, { weekday: 'short' });
  return `${dayPrefix}, ${start.toLocaleTimeString(undefined, tf)} - ${end.toLocaleTimeString(undefined, tf)}`;
}

/** Human-readable pickup open time for errors and celebration copy. */
export function formatPickupOpensAt(pickupStartIso, nowMs = Date.now()) {
  const start = parsePickupMs(pickupStartIso);
  if (start == null) return 'Pickup time to be confirmed';
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return 'Pickup time to be confirmed';
  const tf = { hour: 'numeric', minute: '2-digit' };
  const today = new Date(nowMs);
  const dayPrefix =
    startDate.toDateString() === today.toDateString()
      ? 'Today'
      : startDate.toLocaleDateString('en-LK', { weekday: 'short' });
  return `Pickup opens at ${dayPrefix}, ${startDate.toLocaleTimeString('en-LK', tf)}`;
}
