import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Payload = {
  userId: string;
  template: 'reservation_confirmed' | 'pickup_reminder';
  orderId?: string;
  payload?: Record<string, string>;
};

function isClearanceOrder(payload: Record<string, string>): boolean {
  return payload.orderKind === 'clearance';
}

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

function templateBody(template: Payload['template'], payload: Record<string, string>): string {
  if (template === 'pickup_reminder') {
    const window = payload.pickupWindow ?? 'soon';
    const code = payload.reservationCode ?? '';
    return `Fresh As Ever: Pickup window starts ${window}.${code ? ` Ref ${code}.` : ''} Show your QR in the app.`;
  }
  const code = payload.reservationCode ?? '';
  const bagCount = Number(payload.bagCount ?? 1);
  const outletName = payload.outletName?.trim() ?? '';
  if (bagCount > 1) {
    const at = outletName ? ` at ${outletName}` : '';
    return `Fresh As Ever: ${bagCount} bags reserved${code ? ` (${code})` : ''}${at}. Show your QR at pickup.`;
  }
  if (isClearanceOrder(payload)) {
    return `Fresh As Ever: Your Clearance Shelf order is confirmed${code ? ` (${code})` : ''}. See pickup details in the app.`;
  }
  return `Fresh As Ever: Your rescue bag is reserved${code ? ` (${code})` : ''}. See pickup details in the app.`;
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

    const body = (await req.json()) as Payload;
    if (!body.userId || !body.template) {
      return new Response(JSON.stringify({ error: 'userId and template required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey,
    );

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('phone, notification_prefs')
      .eq('id', body.userId)
      .maybeSingle();

    if (profileErr) throw profileErr;
    const prefs = profile?.notification_prefs as { sms?: boolean } | null;
    const phone = String(profile?.phone ?? '').trim();
    if (!prefs?.sms || !phone) {
      return new Response(JSON.stringify({ skipped: true, reason: 'sms_disabled_or_no_phone' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!sid || !token || !from) {
      return new Response(JSON.stringify({ error: 'Twilio not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const text = templateBody(body.template, body.payload ?? {});
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const form = new URLSearchParams({ To: phone, From: from, Body: text });
    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!twilioRes.ok) {
      const errText = await twilioRes.text();
      console.error('Twilio error', errText);
      return new Response(JSON.stringify({ error: 'SMS send failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
