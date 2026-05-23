'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Storefront, CheckCircle, Clock, MagnifyingGlass } from '@phosphor-icons/react';
import { useAdminMerchants } from '@/hooks/useAdminMerchants';

export default function AdminMerchantsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { rows, loading, error } = useAdminMerchants({ query, statusFilter, page: 1 });

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
            Platform Management
          </p>
          <h1 className="font-display text-h1 text-text">Merchants</h1>
        </div>
      </div>

      {error ? <p className="font-body-sm text-error">{error}</p> : null}

      <div className="flex flex-col md:flex-row gap-md items-center">
        <div className="flex-1 relative w-full group">
          <MagnifyingGlass
            size={20}
            weight="bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchants by name or email..."
            className="w-full bg-surface border border-divider rounded-2xl py-3.5 pl-12 pr-4 font-body-md"
          />
        </div>
        <div className="bg-surface-2 p-1.5 rounded-2xl flex border border-divider">
          {[
            { key: 'all', label: 'All' },
            { key: 'approved', label: 'Approved' },
            { key: 'pending', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-6 py-2 rounded-xl font-label text-sm font-bold ${
                statusFilter === tab.key ? 'bg-white text-primary shadow-elevation-md' : 'text-text-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="font-body-md text-text-muted">Loading merchants…</p>
      ) : rows.length === 0 ? (
        <p className="font-body-md text-text-muted">No merchants match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {rows.map((m) => (
            <Link href={`/admin/merchants/${m.id}`} key={m.id} className="group">
              <div className="bg-surface p-md rounded-3xl border border-divider shadow-elevation-sm flex items-center gap-md hover:border-primary/20 transition-all">
                <div className="w-20 h-20 rounded-2xl bg-surface-2 shrink-0 border border-divider flex items-center justify-center">
                  <Storefront size={32} weight="fill" className="text-primary/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-h3 text-h3 text-text truncate">{m.business_name}</h3>
                    {['approved', 'active', 'live'].includes(m.status.toLowerCase()) ? (
                      <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
                    ) : null}
                  </div>
                  <p className="font-body-sm text-text-muted mb-2">{m.contact_email || '—'}</p>
                  <span className="font-label text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                    {m.status}
                  </span>
                  {m.status === 'pending' ? (
                    <span className="ml-2 font-label text-xs font-bold text-accent inline-flex items-center gap-1">
                      <Clock size={14} weight="bold" />
                      Review
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
