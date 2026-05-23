'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react';
import { useNotificationPrefs } from '@/hooks/useNotificationPrefs';

const ROWS = [
  {
    key: 'push',
    label: 'Push notifications',
    description: 'Order updates and new bags near you',
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Receipts and weekly impact summaries',
  },
  {
    key: 'sms',
    label: 'SMS',
    description: 'Pickup reminders (requires phone on profile)',
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const {
    pushOn,
    emailOn,
    smsOn,
    loading,
    saving,
    error,
    setPush,
    setEmail,
    setSms,
  } = useNotificationPrefs();

  const values = { push: pushOn, email: emailOn, sms: smsOn };
  const setters = { push: setPush, email: setEmail, sms: setSms };

  return (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-black text-text tracking-tight">Notifications</h1>
          <p className="font-body-sm text-text-muted mt-1">
            Saved to your account{saving ? ' · saving…' : ''}
          </p>
        </div>
      </div>
      <main className="max-w-lg mx-auto px-page-margin-mobile py-lg">
        {error && (
          <p className="font-body-sm text-error mb-md" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <div className="bg-surface rounded-xl p-md border border-divider animate-pulse h-40" />
        ) : (
          <div className="bg-surface rounded-xl shadow-[0_4px_12px_rgba(30,27,20,0.04)] divide-y divide-divider">
            {ROWS.map((p) => {
              const on = values[p.key];
              return (
                <div key={p.key} className="flex items-center justify-between p-md gap-md">
                  <div>
                    <p className="font-label text-label text-text">{p.label}</p>
                    <p className="font-body-sm text-body-sm text-text-muted">{p.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => setters[p.key](!on)}
                    className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${on ? 'bg-primary' : 'bg-surface-2'}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
