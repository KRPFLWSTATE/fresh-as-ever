'use client';

import { MagnifyingGlass, ShieldCheck, WarningCircle } from '@phosphor-icons/react';

const mockLogs = [
  { id: 'AUD-9912', actor: 'Platform Admin', action: 'Merchant Approved', target: 'Fresh Bites Deli', time: '2 mins ago', severity: 'info' },
  { id: 'AUD-9911', actor: 'System', action: 'Settlement Released', target: 'The Bread Company', time: '18 mins ago', severity: 'info' },
  { id: 'AUD-9908', actor: 'Platform Admin', action: 'Complaint Resolved', target: 'CMP-003', time: '1 hr ago', severity: 'warning' },
];

export default function AdminAuditLogsPage() {
  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-12">
      <header>
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Governance</p>
        <h1 className="font-display text-h1 text-text">Audit Logs</h1>
      </header>

      <div className="bg-surface rounded-2xl border border-divider p-md md:p-lg shadow-elevation-sm">
        <div className="relative group">
          <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search by action, actor, or target..."
            className="w-full bg-surface-2 border border-divider rounded-xl py-2.5 pl-10 pr-4 font-body-md focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-divider shadow-elevation-sm divide-y divide-divider overflow-hidden">
        {mockLogs.map((log) => (
          <div key={log.id} className="p-md md:p-lg flex flex-col md:flex-row md:items-center gap-sm md:gap-md">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              log.severity === 'warning' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
            }`}>
              {log.severity === 'warning' ? <WarningCircle size={18} weight="fill" /> : <ShieldCheck size={18} weight="fill" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label text-text font-bold">{log.action}</p>
              <p className="font-body-sm text-text-muted">{log.actor} • {log.target}</p>
            </div>
            <div className="font-label-caps text-[10px] text-text-faint">{log.time}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
