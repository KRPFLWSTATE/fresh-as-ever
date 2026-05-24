import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/serviceRoleKey';
import { invokeTransactionalSms } from '@/lib/sms/invokeTransactionalSms';
import { formatPickupLine } from '@/lib/pickupWindow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MIN_MS = 30 * 60 * 1000;
const WINDOW_MAX_MS = 60 * 60 * 1000;

function authorizeCron(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}`) return true;
  const vercel = request.headers.get('x-vercel-cron') ?? request.headers.get('X-Vercel-Cron');
  return vercel === '1' && Boolean(secret);
}

/**
 * Vercel Cron: send pickup_reminder SMS for paid orders whose bag pickup_start is in 30–60 minutes.
 * Secured by CRON_SECRET (Authorization: Bearer) or Vercel cron header + CRON_SECRET set.
 */
export async function GET(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const now = Date.now();
  const windowStart = new Date(now + WINDOW_MIN_MS).toISOString();
  const windowEnd = new Date(now + WINDOW_MAX_MS).toISOString();

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: rows, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      customer_id,
      reservation_code,
      bag:rescue_bags!inner(pickup_start, pickup_end)
    `,
    )
    .is('pickup_reminder_sent_at', null)
    .in('order_status', ['paid', 'ready_for_pickup'])
    .eq('payment_status', 'paid')
    .gte('rescue_bags.pickup_start', windowStart)
    .lte('rescue_bags.pickup_start', windowEnd);

  if (error) {
    console.error('pickup-reminders query failed', error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows ?? []) {
    const bag = row.bag;
    const pickupStart = bag?.pickup_start;
    if (!pickupStart) {
      skipped += 1;
      continue;
    }

    const customerId = row.customer_id;
    if (!customerId) {
      skipped += 1;
      continue;
    }

    const pickupWindow = formatPickupLine(pickupStart, bag.pickup_end);
    const result = await invokeTransactionalSms({
      userId: String(customerId),
      template: 'pickup_reminder',
      orderId: String(row.id),
      payload: {
        reservationCode: String(row.reservation_code ?? ''),
        pickupWindow,
      },
    });

    if (result?.error) {
      errors += 1;
      continue;
    }

    const { error: markErr } = await supabase
      .from('orders')
      .update({ pickup_reminder_sent_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('pickup_reminder_sent_at', null);

    if (markErr) {
      console.error('pickup_reminder_sent_at update failed', row.id, markErr);
      errors += 1;
      continue;
    }

    if (result?.skipped) skipped += 1;
    else sent += 1;
  }

  return NextResponse.json({
    ok: true,
    windowStart,
    windowEnd,
    candidates: rows?.length ?? 0,
    sent,
    skipped,
    errors,
  });
}
