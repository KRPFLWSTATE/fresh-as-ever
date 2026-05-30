import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Payload = {
  processQueue?: boolean;
  shelfId?: string;
  limit?: number;
};

type NotifPrefs = { push?: boolean; email?: boolean; sms?: boolean };

function resolveServiceRoleKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (legacy) return legacy;

  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')?.trim();
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      for (const key of ['service_role', 'SUPABASE_SERVICE_ROLE_KEY', 'service_role_key']) {
        const v = obj[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
  } catch {
    return raw;
  }

  return '';
}

function pushEnabled(prefs: NotifPrefs | null | undefined): boolean {
  if (!prefs || typeof prefs !== 'object') return true;
  if (typeof prefs.push === 'boolean') return prefs.push;
  return true;
}

async function sendExpoPush(
  messages: { to: string; title: string; body: string; data?: Record<string, string> }[],
): Promise<{ sent: number; errors: string[] }> {
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN')?.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let sent = 0;
  const errors: string[] = [];
  const chunkSize = 100;

  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      errors.push(await res.text());
      continue;
    }
    const json = (await res.json()) as { data?: { status?: string; message?: string }[] };
    for (const ticket of json.data ?? []) {
      if (ticket.status === 'ok') sent += 1;
      else if (ticket.message) errors.push(ticket.message);
    }
  }

  return { sent, errors };
}

async function processShelf(
  supabase: ReturnType<typeof createClient>,
  shelfId: string,
): Promise<{ ok: boolean; recipients: number; pushSent: number; skipped?: string }> {
  const { data: shelf, error: shelfErr } = await supabase
    .from('clearance_shelves')
    .select(
      `
      id,
      status,
      outlet_id,
      shelf_date,
      title,
      outlet:outlets ( id, name )
    `,
    )
    .eq('id', shelfId)
    .maybeSingle();

  if (shelfErr || !shelf) {
    return { ok: false, recipients: 0, pushSent: 0, skipped: 'shelf_not_found' };
  }

  if (String(shelf.status ?? '').toLowerCase() !== 'published') {
    return { ok: false, recipients: 0, pushSent: 0, skipped: 'not_published' };
  }

  const outlet = shelf.outlet as { id?: string; name?: string } | null;
  const outletId = shelf.outlet_id as string;
  const outletName = outlet?.name?.trim() || 'A favourite outlet';
  const shelfTitle =
    typeof shelf.title === 'string' && shelf.title.trim()
      ? shelf.title.trim()
      : "Today's clearance shelf";

  const { data: favRows, error: favErr } = await supabase
    .from('favourite_outlets')
    .select('user_id')
    .eq('outlet_id', outletId);

  if (favErr) {
    return { ok: false, recipients: 0, pushSent: 0, skipped: favErr.message };
  }

  const userIds = [...new Set((favRows ?? []).map((r) => String(r.user_id)).filter(Boolean))];
  if (userIds.length === 0) {
    return { ok: true, recipients: 0, pushSent: 0, skipped: 'no_favourites' };
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, notification_prefs')
    .in('id', userIds);

  const pushUserIds = (profiles ?? [])
    .filter((p) => pushEnabled(p.notification_prefs as NotifPrefs))
    .map((p) => String(p.id));

  const title = `${outletName} clearance is live`;
  const body = `${shelfTitle} is ready to browse. Tap to shop before items sell out.`;
  const deepLinkShelfId = String(shelf.id);

  for (const userId of userIds) {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      type: 'shelf_published',
      data: { shelfId: deepLinkShelfId, outletId },
      is_read: false,
    });
  }

  if (pushUserIds.length === 0) {
    return { ok: true, recipients: userIds.length, pushSent: 0, skipped: 'push_disabled' };
  }

  const { data: tokens } = await supabase
    .from('push_device_tokens')
    .select('expo_push_token, user_id')
    .in('user_id', pushUserIds);

  const expoMessages = (tokens ?? []).map((t) => ({
    to: String(t.expo_push_token),
    title,
    body,
    data: {
      shelfId: deepLinkShelfId,
      outletId: String(outletId),
      type: 'shelf_published',
    },
  }));

  if (expoMessages.length === 0) {
    return { ok: true, recipients: userIds.length, pushSent: 0, skipped: 'no_tokens' };
  }

  const { sent, errors } = await sendExpoPush(expoMessages);
  if (errors.length > 0) {
    console.error('Expo push errors', errors.slice(0, 5));
  }

  return { ok: true, recipients: userIds.length, pushSent: sent };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const serviceKey = resolveServiceRoleKey();
    if (!serviceKey) {
      return new Response(JSON.stringify({ error: 'Service role not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!authHeader?.includes(serviceKey) && authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const payload = (await req.json()) as Payload;
    const limit = Math.min(Math.max(payload.limit ?? 10, 1), 50);
    const results: Record<string, unknown>[] = [];

    if (payload.shelfId) {
      const result = await processShelf(supabase, payload.shelfId);
      results.push({ shelfId: payload.shelfId, ...result });
    }

    if (payload.processQueue) {
      const { data: jobs, error: jobErr } = await supabase
        .from('shelf_publish_notification_queue')
        .select('id, shelf_id')
        .is('processed_at', null)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (jobErr) {
        return new Response(JSON.stringify({ error: jobErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      for (const job of jobs ?? []) {
        const shelfId = String(job.shelf_id);
        const result = await processShelf(supabase, shelfId);
        const patch = {
          processed_at: new Date().toISOString(),
          last_error: result.ok ? null : result.skipped ?? 'failed',
        };
        await supabase
          .from('shelf_publish_notification_queue')
          .update(patch)
          .eq('id', job.id);
        results.push({ queueId: job.id, shelfId, ...result });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
