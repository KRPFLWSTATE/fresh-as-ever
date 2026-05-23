'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChatCenteredDots } from '@phosphor-icons/react';
import { useMerchantComplaints } from '@/hooks/useMerchantComplaints';

function statusClass(status) {
  const s = String(status).toLowerCase();
  if (s === 'resolved' || s === 'dismissed') return 'bg-primary/10 text-primary';
  if (s === 'escalated') return 'bg-accent/10 text-accent';
  return 'bg-error/10 text-error';
}

export default function MerchantDisputesPage() {
  const router = useRouter();
  const { rows, loading, error } = useMerchantComplaints();

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button
          type="button"
          onClick={() => router.push('/merchant/dashboard')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-black text-text tracking-tight">Disputes</h1>
          <p className="font-body-sm text-text-muted mt-1">Customer complaints for your outlets</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-page-margin-mobile py-lg space-y-md">
        {error && (
          <p className="font-body-sm text-error" role="alert">
            {error}
          </p>
        )}
        {loading && (
          <div className="bg-surface rounded-xl p-lg border border-divider animate-pulse h-24" />
        )}
        {!loading && rows.length === 0 && (
          <div className="bg-surface rounded-xl p-xl text-center border border-divider">
            <ChatCenteredDots size={40} className="mx-auto text-text-muted mb-md" />
            <p className="font-h3 text-h3 text-text">No active disputes</p>
            <p className="font-body-sm text-text-muted mt-sm">
              Customer complaints about your outlets will appear here.
            </p>
          </div>
        )}
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/merchant/disputes/${row.id}`}
            className="block bg-surface rounded-xl p-md border border-divider hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-md">
              <div>
                <p className="font-label text-label text-text">{row.type}</p>
                <p className="font-body-sm text-text-muted mt-1">{row.orderLabel}</p>
                <p className="font-body-md text-text mt-sm line-clamp-2">{row.description}</p>
                <p className="font-body-sm text-text-faint mt-sm">{row.reporterName} · {row.createdAtLabel}</p>
              </div>
              <span className={`font-label text-label px-sm py-1 rounded-full shrink-0 ${statusClass(row.status)}`}>
                {row.status}
              </span>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
