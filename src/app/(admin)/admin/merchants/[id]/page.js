'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Storefront, Check, X } from '@phosphor-icons/react';
export default function MerchantReviewPage() {
  const router = useRouter();
  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      <div className="flex items-center gap-md"><button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 active:scale-95 text-primary"><ArrowLeft weight="bold" className="w-6 h-6" /></button><h1 className="font-h1 text-h1 text-text">Merchant Application</h1></div>
      <div className="bg-surface rounded-xl p-lg shadow-ambient space-y-lg">
        <div className="flex items-center gap-md pb-lg border-b border-divider">
          <div className="w-16 h-16 rounded-xl bg-surface-2 flex items-center justify-center"><Storefront weight="fill" className="w-8 h-8 text-text-faint" /></div>
          <div><h2 className="font-h2 text-h2 text-text">Fresh Bites Deli</h2><p className="font-body-sm text-body-sm text-text-muted">Colombo 05</p><span className="bg-accent-highlight text-accent px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 inline-block">Pending Review</span></div>
        </div>
        {[{l:'Owner Name',v:'John Silva'},{l:'Business Type',v:'Delicatessen'},{l:'Address',v:'78 Duplication Road, Colombo 05'},{l:'Phone',v:'+94 77 890 1234'},{l:'Email',v:'john@freshbites.lk'},{l:'Business Registration',v:'BR-2024-00456'},{l:'Food Safety License',v:'FSL-COL-2024-0089'}].map((f,i)=>(
          <div key={i} className="flex justify-between items-center py-sm border-b border-divider last:border-0"><span className="font-label text-label text-text-muted">{f.l}</span><span className="font-label text-label text-text">{f.v}</span></div>
        ))}
        <div className="flex gap-md pt-lg">
          <button className="flex-1 h-12 bg-primary text-white font-label text-label rounded-lg active:scale-[0.97] transition-transform flex items-center justify-center gap-2"><Check weight="bold" className="w-5 h-5" />Approve</button>
          <button className="flex-1 h-12 border border-error text-error font-label text-label rounded-lg hover:bg-error/10 active:scale-[0.97] transition-all flex items-center justify-center gap-2"><X weight="bold" className="w-5 h-5" />Reject</button>
        </div>
      </div>
    </main>
  );
}
