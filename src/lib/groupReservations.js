/**
 * Group reservations feature flag (web).
 * Set NEXT_PUBLIC_GROUP_RESERVATIONS_ENABLED=true to enable multi-bag cart UX.
 */
export function isGroupReservationsEnabled() {
  return String(process.env.NEXT_PUBLIC_GROUP_RESERVATIONS_ENABLED ?? '').trim() === 'true';
}
