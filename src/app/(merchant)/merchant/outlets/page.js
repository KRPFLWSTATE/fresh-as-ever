'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function MerchantOutletsPage() {
  const supabase = createClient();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: staff } = await supabase
        .from('merchant_staff')
        .select('merchant_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!staff?.merchant_id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('outlets')
        .select('id, name, category, address')
        .eq('merchant_id', staff.merchant_id)
        .order('name');
      setOutlets(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <h1 className="font-h1 text-h1">Outlets</h1>
      {loading ? <p>Loading…</p> : null}
      <ul className="space-y-sm">
        {outlets.map((o) => (
          <li key={o.id}>
            <Link
              href={`/merchant/outlets/${o.id}`}
              className="block p-md border border-divider rounded-xl hover:border-primary/30"
            >
              <p className="font-semibold">{o.name}</p>
              <p className="text-sm text-text-muted capitalize">{o.category}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
