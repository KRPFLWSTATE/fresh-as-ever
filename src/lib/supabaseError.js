import { ERROR } from './messages/errors.js';

/**
 * Maps Supabase/Postgres errors to stable user-facing copy.
 */
export function mapSupabaseError(error, fallback = ERROR.common.fallback) {
  if (!error) return fallback;
  const code = error.code != null ? String(error.code) : '';
  const message = String(error.message ?? '').toLowerCase();

  if (code === '42501' || message.includes('permission') || message.includes('rls')) {
    return ERROR.common.permission;
  }
  if (code === 'PGRST116' || message.includes('0 rows')) {
    return ERROR.common.notFound;
  }
  if (code === '23505') {
    return ERROR.common.duplicate;
  }
  if (code === 'P0001' || message.includes('sold out') || message.includes('quantity')) {
    return ERROR.checkout.soldOut;
  }
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR.common.network;
  }
  if (
    message.includes('jwt') ||
    message.includes('session') ||
    message.includes('not authenticated') ||
    code === 'PGRST301'
  ) {
    return ERROR.auth.sessionExpired;
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR.common.network;
  }
  if (process.env.NODE_ENV === 'development' && error.message) {
    return `${fallback} (${error.message})`;
  }
  return fallback;
}
