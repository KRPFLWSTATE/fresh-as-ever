'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Warning, CheckCircle, ChatCenteredText } from '@phosphor-icons/react';
import { useAdminComplaints } from '@/hooks/useAdminComplaints';

export default function ComplaintsPage() {
  const [tab, setTab] = useState('all');
  const { rows, loading, error, patchComplaint } = useAdminComplaints({ tab });

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      <div>
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
          Customer Support
        </p>
        <h1 className="font-display text-h1 text-text">Complaints</h1>
      </div>

      <div className="flex gap-2">
        {['all', 'unresolved', 'escalated'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl font-label text-sm font-bold capitalize ${
              tab === t ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? <p className="font-body-sm text-error">{error}</p> : null}
      {loading ? (
        <p className="font-body-md text-text-muted">Loading complaints…</p>
      ) : rows.length === 0 ? (
        <p className="font-body-md text-text-muted">No open complaints in this view.</p>
      ) : (
        <div className="grid grid-cols-1 gap-md">
          {rows.map((c) => (
            <div
              key={c.id}
              className="bg-surface p-xl rounded-[2rem] border border-divider shadow-elevation-sm flex flex-col md:flex-row gap-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                {c.status === 'resolved' ? (
                  <CheckCircle size={32} weight="fill" />
                ) : c.status === 'escalated' ? (
                  <ChatCenteredText size={32} weight="fill" />
                ) : (
                  <Warning size={32} weight="fill" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <span className="font-label text-xs font-bold text-text-faint uppercase">
                  #{c.id.slice(0, 8)} · {c.type}
                </span>
                <h3 className="font-h3 text-h3 text-text">{c.description || 'No description'}</h3>
                <p className="font-body-sm text-text-muted">
                  {c.reporter_name} · {c.merchant_name} · order {c.order_code}
                </p>
                <Link
                  href={`/admin/complaints/${c.id}`}
                  className="font-label text-sm text-primary font-bold"
                >
                  View details
                </Link>
              </div>
              <div className="flex gap-md">
                <button
                  type="button"
                  onClick={() => void patchComplaint(c.id, { status: 'dismissed' })}
                  className="px-6 py-3 bg-surface-2 font-label font-bold rounded-xl"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => void patchComplaint(c.id, { status: 'resolved' })}
                  className="px-8 py-3 bg-primary text-white font-label font-bold rounded-xl"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
