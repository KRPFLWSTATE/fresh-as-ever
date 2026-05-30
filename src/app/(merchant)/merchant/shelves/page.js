'use client';

import Link from 'next/link';
import { useMerchantShelves } from '@/hooks/useMerchantShelves';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';
import { canPublishClearanceShelves } from '@/lib/outletListingMode';

export default function MerchantShelvesPage() {
  const { activeOutlet, loading: contextLoading } = useMerchantContext();
  const outletId = activeOutlet?.id ?? null;
  const outletCategory = activeOutlet?.category ?? null;
  const { shelves, todayShelf, loading, cloneYesterday } = useMerchantShelves(outletId);

  if (!isClearanceShelvesEnabled()) {
    return <div className="p-xl">Clearance shelves are disabled.</div>;
  }

  if (!contextLoading && !canPublishClearanceShelves(outletCategory)) {
    return (
      <div className="p-xl space-y-md">
        <p>This outlet publishes Rescue Bags only.</p>
        <Link href="/merchant/bags">Go to bags</Link>
      </div>
    );
  }

  const yesterday = shelves.find((s) => s.shelf_date !== todayShelf?.shelf_date);

  return (
    <div className="p-xl space-y-lg max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clearance shelves</h1>
        <Link href="/merchant/dashboard" className="text-sm text-primary">
          Dashboard
        </Link>
      </div>

      <Link
        href="/merchant/shelves/today"
        className="block p-lg rounded-2xl border border-divider bg-surface"
      >
        <p className="font-semibold">Today&apos;s shelf</p>
        <p className="text-sm text-text-muted">
          {todayShelf ? `Status: ${todayShelf.status}` : 'Not started — tap to publish'}
        </p>
      </Link>

      {yesterday ? (
        <button
          type="button"
          className="text-sm text-primary"
          onClick={() => void cloneYesterday(yesterday.id)}
        >
          Clone yesterday&apos;s shelf to today
        </button>
      ) : null}

      <section className="space-y-sm">
        <h2 className="font-semibold">History</h2>
        {loading ? <p>Loading…</p> : null}
        {shelves.map((s) => {
          const isToday = s.shelf_date === todayShelf?.shelf_date;
          const row = (
            <>
              <p className="font-medium">{s.shelf_date}</p>
              <p className="text-sm text-text-muted">{s.status}</p>
            </>
          );
          return isToday ? (
            <Link
              key={s.id}
              href="/merchant/shelves/today"
              className="block p-md rounded-xl border border-divider"
            >
              {row}
            </Link>
          ) : (
            <div key={s.id} className="block p-md rounded-xl border border-divider opacity-80">
              {row}
            </div>
          );
        })}
      </section>
    </div>
  );
}
