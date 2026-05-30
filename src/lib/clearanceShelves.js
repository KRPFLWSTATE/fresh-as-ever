/**
 * Clearance Shelf feature flag (web).
 *
 * Literal `true` enables; explicit `false` disables everywhere.
 * When unset, defaults to enabled in development so merchant outlet save → shelves works
 * locally without `.env.local`. Production requires `NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED=true`.
 */
export function resolveClearanceShelvesFlag(raw, isDev = process.env.NODE_ENV === 'development') {
  const value = String(raw ?? '').trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return isDev;
}

export function isClearanceShelvesEnabled() {
  return resolveClearanceShelvesFlag(process.env.NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED);
}
