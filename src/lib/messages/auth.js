import { ERROR } from './errors.js';

export function mapAuthError(message, fallback = ERROR.auth.loginFailed) {
  const m = String(message ?? '').toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) {
    return ERROR.auth.invalidCredentials;
  }
  if (m.includes('email not confirmed')) {
    return 'Confirm your email first, then sign in.';
  }
  return fallback;
}
