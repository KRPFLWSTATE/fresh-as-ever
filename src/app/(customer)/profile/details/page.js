'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, User } from '@phosphor-icons/react';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button onClick={() => router.push('/profile')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm">
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-black text-text tracking-tight">Edit Profile</h1>
        </div>
      </div>
      <main className="max-w-lg mx-auto px-page-margin-mobile py-xl space-y-lg">
        <div className="flex flex-col items-center mb-xl">
          <div className="w-20 h-20 rounded-full bg-primary-highlight flex items-center justify-center text-primary mb-md"><User size={40} weight="fill" /></div>
          <button className="font-label text-label text-primary">Change Photo</button>
        </div>
        <div className="space-y-lg">
          {[{l:'Full Name',v:user?.name||'',p:'Your name'},{l:'Email',v:user?.email||'',p:'email@example.com'},{l:'Phone',v:user?.phone||'',p:'+94 77 123 4567'},{l:'Location',v:'Colombo',p:'City'}].map((f,i)=>(
            <div key={i} className="space-y-xs">
              <label className="font-label text-label text-text-muted">{f.l}</label>
              <input className="w-full px-md py-sm rounded-lg border border-divider bg-surface text-text font-body-md focus:border-primary-highlight focus:ring-2 focus:ring-primary-highlight focus:outline-none" defaultValue={f.v} placeholder={f.p} />
            </div>
          ))}
        </div>
        <button className="w-full h-12 bg-primary-highlight text-white font-label text-label rounded-lg active:scale-[0.97] transition-transform">Save Changes</button>
      </main>
    </div>
  );
}