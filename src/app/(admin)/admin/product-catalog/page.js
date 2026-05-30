'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';

export default function AdminProductCatalogPage() {
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void (async () => {
      let q = supabase
        .from('product_catalog')
        .select('id, barcode, name, brand, source, lookup_count, is_disabled')
        .order('lookup_count', { ascending: false })
        .limit(100);
      if (query.trim()) {
        q = q.ilike('name', `%${query.trim()}%`);
      }
      const { data } = await q;
      setRows(data ?? []);
    })();
  }, [query, supabase]);

  if (!isClearanceShelvesEnabled()) {
    return <div className="p-xl">Feature disabled.</div>;
  }

  return (
    <div className="p-xl space-y-md max-w-4xl">
      <h1 className="text-2xl font-bold">Product catalog</h1>
      <input
        className="w-full border rounded-lg p-sm"
        placeholder="Search name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-sm">Barcode</th>
            <th className="text-left p-sm">Name</th>
            <th className="text-left p-sm">Source</th>
            <th className="text-left p-sm">Lookups</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="p-sm">{row.barcode}</td>
              <td className="p-sm">{row.name}</td>
              <td className="p-sm">{row.source}</td>
              <td className="p-sm">{row.lookup_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
