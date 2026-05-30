'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useDiscoverBags } from '@/hooks/useDiscoverBags';
import { DiscoverShelfCard } from '@/components/DiscoverShelfCard';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';
import { formatDistanceAwayLabel } from '@/lib/utils';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const { feedItems, bags, loading, location, setSearchQuery } = useDiscoverBags();

  const visibleFeed = useMemo(() => {
    const items = feedItems?.length
      ? feedItems
      : (bags ?? []).map((b) => ({ kind: 'bag', id: b.id, ...b }));
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      if (item.kind === 'shelf') {
        return (item.outlet_name ?? '').toLowerCase().includes(query);
      }
      return (
        (item.title ?? '').toLowerCase().includes(query) ||
        (item.outlet_name ?? '').toLowerCase().includes(query)
      );
    });
  }, [feedItems, bags, q]);

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <Link href="/discover" className="text-sm text-primary">
        ← Discover
      </Link>
      <h1 className="font-h1 text-h1">Search rescues</h1>
      <div className="relative">
        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSearchQuery(e.target.value);
          }}
          placeholder="Food, merchant, or neighborhood"
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-divider bg-surface"
        />
      </div>
      {loading ? <p>Searching…</p> : null}
      {!loading && visibleFeed.length === 0 ? (
        <p className="text-text-muted">No bags or shelves match your search.</p>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        {visibleFeed.map((item) => {
          if (item.kind === 'shelf' && isClearanceShelvesEnabled()) {
            return (
              <DiscoverShelfCard
                key={`shelf-${item.id}`}
                item={item}
                userLat={location?.lat}
                userLng={location?.lng}
              />
            );
          }
          const bag = item;
          return (
            <Link key={bag.id} href={`/bags/${bag.id}`} className="block p-lg border rounded-xl">
              <p className="font-semibold">{bag.title}</p>
              <p className="text-sm text-text-muted">{bag.outlet_name}</p>
              {formatDistanceAwayLabel(location.lat, location.lng, bag.outlet_lat, bag.outlet_lng) ? (
                <p className="text-sm text-text-muted mt-1">
                  {formatDistanceAwayLabel(location.lat, location.lng, bag.outlet_lat, bag.outlet_lng)}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export default function DiscoverSearchPage() {
  return (
    <Suspense fallback={<div className="p-xl">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
