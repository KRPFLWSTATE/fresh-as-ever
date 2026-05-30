'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Bell, GlobeHemisphereWest, SlidersHorizontal } from '@phosphor-icons/react';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [settingsState, setSettingsState] = useState({
    require2fa: true,
    ipAllowlist: false,
    incidentAlerts: true,
    dailySummary: true,
    colomboMonitoring: true,
    autoOpenZones: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (!userId) {
          setProfile(null);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', userId)
          .single();

        setProfile(data || null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [supabase]);

  const sections = [
    {
      title: 'Platform Security',
      icon: ShieldCheck,
      items: [
        { id: 'require2fa', label: 'Require 2FA for admins', enabled: settingsState.require2fa },
        { id: 'ipAllowlist', label: 'IP allowlist for dashboard access', enabled: settingsState.ipAllowlist },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { id: 'incidentAlerts', label: `Critical incident alerts (${profile?.email || 'no email'})`, enabled: settingsState.incidentAlerts },
        { id: 'dailySummary', label: 'Daily operations summary', enabled: settingsState.dailySummary },
      ],
    },
    {
      title: 'Regional Controls',
      icon: GlobeHemisphereWest,
      items: [
        { id: 'colomboMonitoring', label: 'Enable Colombo zone monitoring', enabled: settingsState.colomboMonitoring },
        { id: 'autoOpenZones', label: 'Auto-open new district zones', enabled: settingsState.autoOpenZones },
      ],
    },
  ];

  const toggleSetting = (key) => {
    setSettingsState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setStatusMessage('');
      const { error } = await supabase.auth.updateUser({
        data: {
          admin_settings: settingsState,
        },
      });
      if (error) throw error;
      setStatusMessage('Settings saved successfully.');
    } catch (_err) {
      setStatusMessage('Could not save settings right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <header>
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Administration</p>
        <h1 className="font-display text-h1 text-text">Settings</h1>
        <p className="font-body-sm text-text-muted mt-1">{profile?.full_name || 'Admin User'} • {profile?.role || 'admin'}</p>
      </header>
      {statusMessage ? <p className="font-body-sm text-text-muted">{statusMessage}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {loading && (
          <article className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm">
            <p className="font-body-sm text-text-muted">Loading admin configuration...</p>
          </article>
        )}
        {!loading && sections.map((section) => {
          const Icon = section.icon;
          return (
            <article key={section.title} className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm">
              <div className="flex items-center gap-2 mb-md">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon size={18} weight="fill" />
                </div>
                <h2 className="font-h3 text-h3 text-text">{section.title}</h2>
              </div>
              <div className="space-y-sm">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => toggleSetting(item.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-divider text-left"
                  >
                    <span className="font-body-sm text-text">{item.label}</span>
                    <span className={`w-11 h-6 rounded-full relative border ${item.enabled ? 'bg-success border-success/20' : 'bg-surface border-divider'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </span>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      {isClearanceShelvesEnabled() ? (
        <section className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm space-y-sm">
          <h2 className="font-h3 text-h3">Clearance shelf ops</h2>
          <p className="font-body-sm text-text-muted">
            Feature flag is on for this environment. Manage shelves and the shared product catalog.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/shelves" className="text-primary font-label font-bold">
              Clearance shelves →
            </Link>
            <Link href="/admin/product-catalog" className="text-primary font-label font-bold">
              Product catalog →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <SlidersHorizontal size={20} weight="fill" />
          </div>
          <div>
            <p className="font-label text-text font-bold">Apply global setting changes</p>
            <p className="font-body-sm text-text-muted">Settings update all admin consoles instantly.</p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-primary text-white font-label font-bold disabled:bg-divider disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </section>
    </main>
  );
}
