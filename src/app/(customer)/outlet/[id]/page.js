'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';
import { canPublishClearanceShelves, canPublishRescueBags } from '@/lib/outletListingMode';
import { formatPickupRangeLabel } from '@/lib/utils';
import { OutletTrustBadge } from '@/components/OutletTrustBadge';

export default function OutletDetailPage() {
  const { id } = useParams();
  const outletId = Array.isArray(id) ? id[0] : id;
  const supabase = createClient();
  const [outlet, setOutlet] = useState(null);
  const [bags, setBags] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!outletId) return;
    void (async () => {
      const [outletRes, bagsRes, shelvesRes] = await Promise.all([
        supabase
          .from('outlets')
          .select('*, merchant:merchants(business_name)')
          .eq('id', outletId)
          .maybeSingle(),
        supabase
          .from('rescue_bags')
          .select('id, title, rescue_price, image_url, pickup_start, pickup_end, quantity_remaining')
          .eq('outlet_id', outletId)
          .eq('status', 'live')
          .gt('quantity_remaining', 0)
          .order('pickup_end', { ascending: true }),
        isClearanceShelvesEnabled()
          ? supabase
              .from('clearance_shelves')
              .select('id, pickup_start, pickup_end, status, items:clearance_shelf_items(id, status, quantity_remaining)')
              .eq('outlet_id', outletId)
              .eq('status', 'published')
              .gt('pickup_end', new Date().toISOString())
          : Promise.resolve({ data: [] }),
      ]);
      setOutlet(outletRes.data ?? null);
      setBags(bagsRes.data ?? []);
      const liveShelves = (shelvesRes.data ?? []).filter((s) =>
        (s.items ?? []).some((i) => i.status === 'live' && i.quantity_remaining > 0),
      );
      setShelves(liveShelves);
      setLoading(false);
    })();
  }, [outletId, supabase]);

  if (loading) return <div className="p-xl">Loading outlet…</div>;
  if (!outlet) {
    return (
      <div className="p-xl space-y-md">
        <p>Outlet not found.</p>
        <Link href="/discover">Back to discover</Link>
      </div>
    );
  }

  const showShelves =
    isClearanceShelvesEnabled() && canPublishClearanceShelves(outlet.category);
  const showBags =
    canPublishRescueBags(outlet.category);

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <Link href="/discover" className="text-sm text-primary">
        ← Discover
      </Link>
      <header className="space-y-sm">
        <h1 className="font-h1 text-h1">{outlet.name}</h1>
        <p className="text-text-muted">{outlet.address}</p>
        <OutletTrustBadge
          trustScore={outlet.trust_score}
          averageRating={outlet.average_rating}
          totalReviews={outlet.total_reviews}
        />
      </header>

      {showShelves && shelves.length > 0 ? (
        <section className="space-y-md">
          <h2 className="font-h3">Clearance shelves</h2>
          <ul className="space-y-sm">
            {shelves.map((shelf) => {
              const liveCount = (shelf.items ?? []).filter(
                (i) => i.status === 'live' && i.quantity_remaining > 0,
              ).length;
              return (
                <li key={shelf.id}>
                  <Link
                    href={`/shelves/${shelf.id}`}
                    className="block p-md border border-divider rounded-xl hover:border-primary/30"
                  >
                    <p className="font-semibold">Today&apos;s shelf · Pick your own</p>
                    <p className="text-sm text-text-muted">
                      {liveCount} item{liveCount === 1 ? '' : 's'} · Pickup{' '}
                      {formatPickupRangeLabel(shelf.pickup_start, shelf.pickup_end)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {showBags && bags.length > 0 ? (
        <section className="space-y-md">
          <h2 className="font-h3">Rescue bags</h2>
          <ul className="space-y-sm">
            {bags.map((bag) => (
              <li key={bag.id}>
                <Link
                  href={`/bags/${bag.id}`}
                  className="block p-md border border-divider rounded-xl hover:border-primary/30"
                >
                  <p className="font-semibold">{bag.title}</p>
                  <p className="text-sm text-text-muted">
                    LKR {Number(bag.rescue_price).toLocaleString('en-LK')} · Pickup{' '}
                    {formatPickupRangeLabel(bag.pickup_start, bag.pickup_end)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(!showBags || bags.length === 0) && (!showShelves || shelves.length === 0) ? (
        <p className="text-text-muted">Nothing live at this outlet right now.</p>
      ) : null}
    </main>
  );
}
