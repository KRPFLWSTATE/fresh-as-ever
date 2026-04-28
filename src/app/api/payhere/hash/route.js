import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { order_id, amount, currency = "LKR" } = await request.json();

    const merchant_id = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const original_secret = process.env.PAYHERE_SECRET;
    
    if (!merchant_id || !original_secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const hashedsecret = crypto.createHash('md5').update(original_secret).digest('hex').toUpperCase();

    // merchant_id + order_id + payhere_amount + payhere_currency + hashedsecret
    // amount should be formatted with 2 decimal places
    const formattedAmount = parseFloat(amount).toFixed(2);
    
    const hashString = merchant_id + order_id + formattedAmount + currency + hashedsecret;
    const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    return NextResponse.json({ hash, merchant_id, currency, amount: formattedAmount });

  } catch (err) {
    console.error('Error generating hash:', err);
    return NextResponse.json({ error: 'Failed to generate hash' }, { status: 500 });
  }
}
