'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';

export default function AdminClearanceShelvesPage() {
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('clearance_shelves')
        .select('id, shelf_date, status, outlet:outlets(name)')
        .order('shelf_date', { ascending: false })
        .limit(50);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  if (!isClearanceShelvesEnabled()) {
    return <div className="p-xl">Feature disabled.</div>;
  }

  return (
    <div className="p-xl space-y-md">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clearance shelves</h1>
        <Link href="/admin/dashboard">Dashboard</Link>
      </div>
      {loading ? <p>Loading…</p> : null}
      <ul className="space-y-sm">
        {rows.map((row) => (
          <li key={row.id} className="p-md border rounded-lg">
            <p className="font-medium">{row.outlet?.name}</p>
            <p className="text-sm">
              {row.shelf_date} · {row.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
