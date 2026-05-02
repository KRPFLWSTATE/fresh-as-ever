'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  CreditCard, 
  Bell, 
  Question, 
  Gear, 
  Leaf, 
  CaretRight, 
  SignOut,
  House
} from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerImpact } from '@/hooks/useCustomerImpact';

const menuItems = [
  { href: '/profile/details', Icon: User, label: 'Edit Profile', subtitle: 'Update your personal info' },
  { href: '/profile/payments', Icon: CreditCard, label: 'Payment Methods', subtitle: 'Manage saved cards' },
  { href: '/profile/notifications', Icon: Bell, label: 'Notifications', subtitle: 'Notification preferences' },
  { href: '/profile/support', Icon: Question, label: 'Help & Support', subtitle: 'FAQs, contact us' },
];

function ProfilePageInner() {
  const searchParams = useSearchParams();
  const suspendedNotice = searchParams.get('suspended') === '1';
  const { user, logout } = useAuth();
  const {
    bagsRescued,
    co2SavedKg,
    totalSavedRs,
    loading: impactLoading,
  } = useCustomerImpact();
  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-divider flex justify-between items-center w-full px-page-margin-mobile md:px-page-margin-desktop h-16">
        <h1 className="font-display text-h2 text-text">Profile</h1>
        <div className="flex items-center gap-2">
          <Link href="/discover" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors">
            <House size={22} weight="bold" className="text-text" />
          </Link>
          <Link href="/profile/details" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors">
            <Gear size={24} weight="bold" className="text-text" />
          </Link>
        </div>
      </header>

      <main className="px-page-margin-mobile md:px-page-margin-desktop py-8 max-w-lg mx-auto space-y-8 pb-32">
        {suspendedNotice && (
          <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 font-body-sm text-error">
            Your account has been temporarily suspended due to repeated missed pickups. Contact support to appeal.
          </div>
        )}
        {/* User Card */}
        <div className="bg-surface rounded-3xl p-6 shadow-elevation-sm border border-divider flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-highlight flex items-center justify-center text-primary shrink-0 border border-divider shadow-inner">
            <User size={40} weight="fill" />
          </div>
          <div className="min-w-0">
            <h2 className="font-h3 text-h3 text-text truncate">{user?.name || 'User'}</h2>
            <p className="font-body-sm text-text-muted truncate">{user?.email || user?.phone || 'Welcome to Fresh As Ever'}</p>
          </div>
        </div>

        {/* Impact Card */}
        <div className="bg-primary text-white rounded-3xl p-8 shadow-elevation-md relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
            <Leaf size={160} weight="fill" />
          </div>
          <h3 className="font-h3 text-h3 mb-6 relative z-10">Your Impact</h3>
          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div className="text-center">
              <div className="font-display text-3xl font-bold mb-1">
                {impactLoading ? '…' : bagsRescued}
              </div>
              <div className="font-label text-[10px] uppercase tracking-widest text-white/70 font-bold">Bags</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold mb-1">
                {impactLoading ? '…' : co2SavedKg}
              </div>
              <div className="font-label text-[10px] uppercase tracking-widest text-white/70 font-bold">kg CO₂</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold mb-1">
                {impactLoading ? '…' : `Rs. ${Number(totalSavedRs).toLocaleString()}`}
              </div>
              <div className="font-label text-[10px] uppercase tracking-widest text-white/70 font-bold">Saved</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-surface rounded-3xl shadow-elevation-sm border border-divider overflow-hidden">
          {menuItems.map((item, idx) => (
            <Link 
              href={item.href} 
              key={item.href} 
              className={`flex items-center gap-4 p-5 hover:bg-surface-2 transition-all group active:bg-surface-2 ${
                idx !== menuItems.length - 1 ? 'border-b border-divider' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-primary shrink-0 border border-divider group-hover:bg-white transition-colors">
                <item.Icon size={24} weight="bold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-text font-bold">{item.label}</p>
                <p className="font-body-xs text-text-muted truncate">{item.subtitle}</p>
              </div>
              <CaretRight size={20} weight="bold" className="text-text-faint group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl border-2 border-error/20 text-error font-label text-sm font-bold flex items-center justify-center gap-3 hover:bg-error hover:text-white hover:border-error active:scale-[0.98] transition-all"
        >
          <SignOut size={20} weight="bold" />
          Sign Out
        </button>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProfilePageInner />
    </Suspense>
  );
}

