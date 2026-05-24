/**
 * Resolve Supabase service role key from env.
 * Prefers `SUPABASE_SECRET_KEYS` JSON (new Supabase default), falls back to legacy `SUPABASE_SERVICE_ROLE_KEY`.
 */
export function getServiceRoleKey() {
  const legacy = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (legacy) return legacy;

  const raw = process.env.SUPABASE_SECRET_KEYS?.trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();
    if (parsed && typeof parsed === 'object') {
      const candidates = [
        parsed.service_role,
        parsed.SUPABASE_SERVICE_ROLE_KEY,
        parsed.service_role_key,
      ];
      for (const c of candidates) {
        if (typeof c === 'string' && c.trim()) return c.trim();
      }
    }
  } catch {
    // not JSON — treat whole value as key
    return raw;
  }

  return null;
}
