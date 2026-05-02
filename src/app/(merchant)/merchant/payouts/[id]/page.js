'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Bank, DownloadSimple, ArrowCircleUp, FileText, Bag, Percent, CreditCard, Circle } from '@phosphor-icons/react';

export default function PayoutDetailPage() {
  const router = useRouter();
  
  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-xl pt-4">
        <button 
          onClick={() => router.back()} 
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Transaction Records</p>
          <h1 className="font-display text-h1 text-text">Payout Details</h1>
        </div>
      </div>

      {/* Hero Status Card */}
      <div className="bg-surface rounded-[3rem] p-xl border border-divider shadow-elevation-md flex flex-col items-center text-center space-y-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-success" />
        <div className="w-20 h-20 rounded-[2rem] bg-success/10 flex items-center justify-center text-success border border-success/20 shadow-inner">
          <CheckCircle size={40} weight="fill" />
        </div>
        <div className="space-y-1">
          <p className="font-label text-xs font-black text-text-muted uppercase tracking-widest">Amount Disbursed</p>
          <h2 className="font-display text-display text-text">Rs. 12,450</h2>
          <p className="font-body-md text-text-muted mt-2">Settled on April 28, 2024</p>
        </div>
        <div className="flex items-center gap-2 bg-success/10 text-success px-6 py-2 rounded-full border border-success/20">
          <Circle size={8} weight="fill" className="animate-pulse" />
          <span className="font-label text-xs font-bold uppercase tracking-widest">Transfer Completed</span>
        </div>
      </div>

      {/* breakdown Summary */}
      <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm space-y-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-highlight text-primary flex items-center justify-center border border-primary/10">
            <FileText size={20} weight="fill" />
          </div>
          <h3 className="font-h3 text-h3 text-text">Settlement Summary</h3>
        </div>

        <div className="space-y-lg">
          {[
            { l: 'Gross Sales (42 Bags)', v: 'Rs. 14,000', i: Bag, c: 'text-text' },
            { l: 'Platform Fee (10%)', v: '- Rs. 1,400', i: Percent, c: 'text-error' },
            { l: 'Processing Fee (1.5%)', v: '- Rs. 150', i: CreditCard, c: 'text-error' }
          ].map((item, i) => {
            const Icon = item.i;
            return (
              <div key={i} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-faint border border-divider group-hover:text-primary transition-colors">
                    <Icon size={16} weight="bold" />
                  </div>
                  <span className="font-label text-sm font-bold text-text-muted uppercase tracking-tight">{item.l}</span>
                </div>
                <span className={`font-display text-lg font-bold ${item.c}`}>{item.v}</span>
              </div>
            );
          })}
          
          <div className="pt-xl border-t border-divider flex justify-between items-center">
            <span className="font-display text-2xl font-black text-text">Net Payout</span>
            <span className="font-display text-3xl font-black text-success tracking-tighter">Rs. 12,450</span>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm">
        <div className="flex items-center gap-3 mb-xl">
          <div className="w-10 h-10 rounded-xl bg-accent-highlight text-accent flex items-center justify-center border border-accent/10">
            <Bank size={20} weight="fill" />
          </div>
          <h3 className="font-h3 text-h3 text-text">Destination Account</h3>
        </div>
        
        <div className="flex items-center gap-xl bg-surface-2 p-6 rounded-[2rem] border border-divider">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-divider shadow-elevation-sm">
            <Bank size={32} weight="bold" className="text-text-muted" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-text">Commercial Bank</p>
            <p className="font-body-md text-text-muted tracking-widest mt-1">•••• 4589</p>
          </div>
        </div>
      </div>

      <button className="w-full h-16 bg-surface hover:bg-surface-2 border border-divider text-text font-display text-lg font-black rounded-[2rem] shadow-elevation-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 group">
        <DownloadSimple size={24} weight="bold" className="group-hover:translate-y-1 transition-transform" />
        Download Settlement PDF
      </button>
    </main>
  );
}

