import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { invokeTransactionalSms } from '@/lib/sms/invokeTransactionalSms';

/**
 * PayHere notify_url webhook.
 *
 * TESTING_ENV: When set (e.g. in CI), MD5 signature verification may be skipped and
 * Supabase may fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY if SUPABASE_SERVICE_ROLE_KEY
 * is unset — for local/contract tests only. Never set TESTING_ENV in production.
 */
export async function POST(request) {
  try {
    const reqText = await request.text();
    const params = new URLSearchParams(reqText);

    const merchant_id = params.get('merchant_id');
    const order_id = params.get('order_id');
    const payhere_amount = params.get('payhere_amount');
    const payhere_currency = params.get('payhere_currency');
    const status_code = params.get('status_code');
    const md5sig = params.get('md5sig');
    const payment_id = params.get('payment_id');

    const original_secret = process.env.PAYHERE_SECRET || process.env.PAYHERE_MERCHANT_SECRET;
    if (!original_secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    const hashedsecret = crypto.createHash('md5').update(original_secret).digest('hex').toUpperCase();

    const hashString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedsecret;
    const local_md5sig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    const testingEnv = Boolean(process.env.TESTING_ENV);
    if (local_md5sig !== md5sig && !testingEnv) {
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    if (status_code === '2') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
      }

      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!testingEnv && !serviceKey) {
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
      }

      const supabaseKey = testingEnv
        ? serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : serviceKey;
      if (!supabaseKey) {
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: group, error: groupReadErr } = await supabase
        .from('reservation_groups')
        .select(
          'id, customer_id, reservation_code, payment_status, order_status, bag_count, outlet:outlets(name)',
        )
        .eq('id', order_id)
        .maybeSingle();

      if (groupReadErr) throw groupReadErr;

      if (group) {
        if (String(group.payment_status ?? '').toLowerCase() === 'paid') {
          return NextResponse.json({ success: true }, { status: 200 });
        }

        const { error: groupUpErr } = await supabase
          .from('reservation_groups')
          .update({
            payment_status: 'paid',
            order_status: 'paid',
            ...(payment_id ? { payhere_payment_id: payment_id } : {}),
          })
          .eq('id', group.id)
          .eq('order_status', 'reserved');

        if (groupUpErr) throw groupUpErr;

        const { error: childErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'paid',
          })
          .eq('group_id', group.id)
          .eq('order_status', 'reserved');

        if (childErr) throw childErr;

        if (group.customer_id) {
          const bagCount = Number(group.bag_count ?? 1);
          const outletName =
            group.outlet?.name != null ? String(group.outlet.name) : '';
          void invokeTransactionalSms({
            userId: String(group.customer_id),
            template: 'reservation_confirmed',
            orderId: String(group.id),
            payload: {
              reservationCode: String(group.reservation_code ?? ''),
              bagCount: String(bagCount),
              outletName,
            },
          });
        }

        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { data: existing, error: readErr } = await supabase
        .from('orders')
        .select('id, payment_status, order_status, customer_id, reservation_code, shelf_id')
        .eq('id', order_id)
        .maybeSingle();

      if (readErr) throw readErr;
      if (existing && String(existing.payment_status ?? '').toLowerCase() === 'paid') {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'paid',
          ...(payment_id ? { payhere_payment_id: payment_id } : {}),
        })
        .eq('id', order_id)
        .eq('order_status', 'reserved');

      if (error) throw error;

      if (existing?.customer_id) {
        void invokeTransactionalSms({
          userId: String(existing.customer_id),
          template: 'reservation_confirmed',
          orderId: String(order_id),
          payload: {
            reservationCode: String(existing.reservation_code ?? ''),
            bagCount: '1',
            ...(existing.shelf_id ? { orderKind: 'clearance' } : {}),
          },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
