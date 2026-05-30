import { ERROR } from './errors.js';

function lower(msg) {
  return String(msg ?? '').toLowerCase();
}

export function mapHandoverError(message, fallback = ERROR.handover.failed) {
  const m = lower(message);
  if (m.includes('grace') || m.includes('30 minute')) return ERROR.handover.grace;
  if (m.includes('order_not_ready') || m.includes('not ready') || m.includes('not_ready')) {
    return ERROR.handover.notReady;
  }
  if (m.includes('code_mismatch') || m.includes('mismatch')) return ERROR.handover.codeMismatch;
  if (m.includes('code_length') || m.includes('6 character')) return ERROR.handover.codeLength;
  return fallback;
}

export function mapArrivalError(message, fallback = ERROR.arrival.failed) {
  const m = lower(message);
  if (m.includes('not_eligible') || m.includes('window') || m.includes('15 minute')) {
    return ERROR.arrival.notEligible;
  }
  if (m.includes('payment')) return ERROR.arrival.paymentFirst;
  return fallback;
}

export function mapCheckoutError(message, fallback = ERROR.checkout.reserveFailed) {
  const m = lower(message);
  if (m.includes('sold out') || m.includes('quantity') || m.includes('clearance_item_sold_out')) {
    return ERROR.checkout.soldOut;
  }
  if (m.includes('shelf_pickup_ended')) return 'This shelf is closed for today.';
  if (m.includes('shelf_not_published')) return 'This shelf is not available yet.';
  if (m.includes('invalid_items_payload')) return 'Your basket changed — review items and try again.';
  if (m.includes('network') || m.includes('fetch')) return ERROR.common.network;
  return fallback;
}
