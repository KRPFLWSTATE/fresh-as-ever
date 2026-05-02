'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react';

export default function NotificationsPage() {
  const router = useRouter();
  const prefs = [{l:'Order Updates',d:'Get notified about order status changes',on:true},{l:'New Bags Near You',d:'When merchants post new rescue bags nearby',on:true},{l:'Promotions',d:'Deals and promotional offers',on:false},{l:'Weekly Impact Report',d:'Your food rescue impact summary',on:true}];
  return (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button onClick={() => router.push('/profile')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm">
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-black text-text tracking-tight">Notifications</h1>
        </div>
      </div>
      <main className="max-w-lg mx-auto px-page-margin-mobile py-lg">
        <div className="bg-surface rounded-xl shadow-[0_4px_12px_rgba(30,27,20,0.04)] divide-y divide-divider">
          {prefs.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-md">
              <div><p className="font-label text-label text-text">{p.l}</p><p className="font-body-sm text-body-sm text-text-muted">{p.d}</p></div>
              <button className={`w-12 h-7 rounded-full transition-colors relative ${p.on ? 'bg-primary' : 'bg-surface-2'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${p.on ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}