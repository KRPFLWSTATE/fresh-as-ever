'use client';

import { Warning, CheckCircle, ChatCenteredText, MagnifyingGlass, Funnel } from '@phosphor-icons/react';

export default function ComplaintsPage() {
  const complaints = [
    { id: 'CMP-001', customer: 'Amara S.', merchant: 'BreadTalk', issue: 'Bag was half empty', status: 'open', date: 'Today' },
    { id: 'CMP-002', customer: 'Kavin P.', merchant: 'Cafe Kumbuk', issue: 'Wrong items in bag', status: 'resolved', date: 'Yesterday' },
    { id: 'CMP-003', customer: 'Nimal F.', merchant: 'Keells', issue: 'Late pickup window', status: 'investigating', date: '2 days ago' }
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Customer Support</p>
          <h1 className="font-display text-h1 text-text">Complaints</h1>
        </div>
        <div className="flex items-center gap-sm w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID, customer..." 
              className="w-full bg-surface border border-divider rounded-2xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md shadow-elevation-sm"
            />
          </div>
          <button className="p-3 bg-surface border border-divider rounded-2xl text-text-muted hover:text-primary hover:border-primary transition-all shadow-elevation-sm">
            <Funnel size={20} weight="bold" />
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div className="grid grid-cols-1 gap-md">
        {complaints.map((c, i) => (
          <div key={i} className="bg-surface p-xl rounded-[2rem] border border-divider shadow-elevation-sm flex flex-col md:flex-row gap-xl items-start md:items-center hover:shadow-elevation-md hover:border-primary/20 transition-all group">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
              c.status === 'open' 
                ? 'bg-accent/10 border-accent/20 text-accent' 
                : c.status === 'resolved'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-primary/10 border-primary/20 text-primary'
            }`}>
              {c.status === 'open' ? (
                <Warning size={32} weight="fill" />
              ) : c.status === 'resolved' ? (
                <CheckCircle size={32} weight="fill" />
              ) : (
                <ChatCenteredText size={32} weight="fill" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  c.status === 'open' 
                    ? 'bg-accent/10 text-accent border-accent/20' 
                    : c.status === 'resolved'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  {c.status}
                </span>
                <span className="font-label text-xs font-bold text-text-faint tracking-widest uppercase">#{c.id}</span>
                <span className="text-text-faint/30">•</span>
                <span className="font-label text-xs font-medium text-text-muted">{c.date}</span>
              </div>
              
              <h3 className="font-h3 text-h3 text-text group-hover:text-primary transition-colors">{c.issue}</h3>
              
              <div className="flex items-center gap-2 font-body-sm text-text-muted">
                <span className="font-bold text-text">{c.customer}</span>
                <span className="text-text-faint">reported against</span>
                <span className="font-bold text-text">{c.merchant}</span>
              </div>
            </div>

            <div className="flex items-center gap-md w-full md:w-auto pt-md md:pt-0 border-t md:border-t-0 border-divider">
              <button className="flex-1 md:flex-none px-6 py-3 bg-surface-2 hover:bg-surface-2 text-text font-label font-bold rounded-xl transition-all active:scale-95">
                Dismiss
              </button>
              <button className="flex-1 md:flex-none px-8 py-3 bg-primary hover:bg-primary-hover text-white font-label font-bold rounded-xl shadow-elevation-md transition-all active:scale-95">
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

