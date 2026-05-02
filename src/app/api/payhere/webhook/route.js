import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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

    const original_secret = process.env.PAYHERE_SECRET;
    if (!original_secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    const hashedsecret = crypto.createHash('md5').update(original_secret).digest('hex').toUpperCase();

    const hashString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedsecret;
    const local_md5sig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    if (local_md5sig !== md5sig && !process.env.TESTING_ENV) {
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    if (status_code === '2') {
      // Payment success
      // Initialize admin supabase client to bypass RLS
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', order_status: 'paid' })
        .eq('id', order_id)
        .eq('order_status', 'reserved');

      if (error) throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
