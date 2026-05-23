'use client';

import { useState } from 'react';
import { MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react';
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const { rows, loading, error, totalCount } = useAdminAuditLogs({ search, kind, page: 1 });

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-12">
      <header>
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">
          Governance
        </p>
        <h1 className="font-display text-h1 text-text">Audit Logs</h1>
        <p className="font-body-sm text-text-muted mt-2">{totalCount} entries (paginated)</p>
      </header>

      <div className="bg-surface rounded-2xl border border-divider p-md flex flex-col md:flex-row gap-md">
        <div className="relative flex-1 group">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, title, detail..."
            className="w-full bg-surface-2 border border-divider rounded-xl py-2.5 pl-10 pr-4 font-body-md"
          />
        </div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="bg-surface-2 border border-divider rounded-xl px-4 py-2.5 font-label"
        >
          <option value="all">All kinds</option>
          <option value="merchant">Merchant</option>
          <option value="order">Order</option>
          <option value="complaint">Complaint</option>
          <option value="settings">Settings</option>
        </select>
      </div>

      {error ? <p className="font-body-sm text-error">{error}</p> : null}

      <div className="bg-surface rounded-2xl border border-divider shadow-elevation-sm divide-y divide-divider overflow-hidden">
        {loading ? (
          <p className="p-lg font-body-md text-text-muted">Loading audit logs…</p>
        ) : rows.length === 0 ? (
          <p className="p-lg font-body-md text-text-muted">No audit entries found.</p>
        ) : (
          rows.map((log) => (
            <div key={log.id} className="p-md md:p-lg flex flex-col md:flex-row md:items-center gap-sm md:gap-md">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck size={18} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label text-text font-bold">{log.title || log.action}</p>
                <p className="font-body-sm text-text-muted">
                  {log.kind} · {log.actor_role} · {log.detail}
                </p>
              </div>
              <div className="font-label-caps text-[10px] text-text-faint">
                {log.occurred_at ? new Date(log.occurred_at).toLocaleString() : '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
