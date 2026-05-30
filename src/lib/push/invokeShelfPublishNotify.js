import { getServiceRoleKey } from '@/lib/supabase/serviceRoleKey';

/**
 * Invoke Supabase Edge Function notify-shelf-published (service role).
 */
export async function invokeShelfPublishNotify({ processQueue = true, shelfId, limit = 10 } = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceKey) {
    return { skipped: true, reason: 'missing_config' };
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/notify-shelf-published`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        processQueue: Boolean(processQueue),
        ...(shelfId ? { shelfId } : {}),
        limit,
      }),
    });
    if (!res.ok) {
      console.error('Shelf publish notify invoke failed', await res.text());
      return { error: 'notify_failed' };
    }
    return { ok: true, ...(await res.json()) };
  } catch (e) {
    console.error('Shelf publish notify invoke error', e);
    return { error: 'notify_failed' };
  }
}
