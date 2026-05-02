'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tag, Plus, Clock, Pause, CheckCircle } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from '@/hooks/useMerchantContext';

export default function MerchantPromotionsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeOutlet, loading: merchantLoading } = useMerchantContext();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const loadPromotions = async () => {
      if (!activeOutlet?.id) {
        if (!merchantLoading) {
          setPromos([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('promos')
          .select('code, discount_type, discount_value, usage_count, status, expires_at')
          .eq('outlet_id', activeOutlet.id)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;

        const mapped = (data || []).map((promo) => {
          const isPercent = promo.discount_type === 'percent';
          const value = isPercent ? `${promo.discount_value}% off` : `Rs. ${Number(promo.discount_value || 0).toLocaleString()} off`;
          return {
            code: promo.code || 'PROMO',
            value,
            usage: `${Number(promo.usage_count || 0).toLocaleString()} uses`,
            status: promo.status || 'paused',
            expiry: promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'No expiry',
          };
        });

        setPromos(mapped);
      } catch (_err) {
        setPromos([
          { code: 'WELCOME10', value: '10% off', usage: '0 uses', status: 'paused', expiry: 'No expiry' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPromotions();
  }, [activeOutlet?.id, merchantLoading, supabase]);

  const togglePromoStatus = async (code, nextStatus) => {
    try {
      setStatusMessage('');
      const { error } = await supabase
        .from('promos')
        .update({ status: nextStatus })
        .eq('outlet_id', activeOutlet?.id)
        .eq('code', code);
      if (error) throw error;
      setPromos((prev) => prev.map((promo) => (promo.code === code ? { ...promo, status: nextStatus } : promo)));
      setStatusMessage(`Promotion ${code} updated to ${nextStatus}.`);
    } catch (_err) {
      setStatusMessage('Could not update promotion status.');
    }
  };

  const createCampaign = async () => {
    if (!activeOutlet?.id) return;
    const randomCode = `SAVE${Math.floor(100 + Math.random() * 900)}`;
    try {
      setSaving(true);
      setStatusMessage('');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('promos').insert({
        outlet_id: activeOutlet.id,
        code: randomCode,
        discount_type: 'percent',
        discount_value: 10,
        usage_count: 0,
        status: 'active',
        expires_at: expiresAt,
      });
      if (error) throw error;

      setPromos((prev) => [
        {
          code: randomCode,
          value: '10% off',
          usage: '0 uses',
          status: 'active',
          expiry: new Date(expiresAt).toLocaleDateString(),
        },
        ...prev,
      ]);
      setStatusMessage(`Campaign ${randomCode} created.`);
    } catch (_err) {
      setStatusMessage('Could not create campaign. Check promo table permissions/schema.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Growth</p>
          <h1 className="font-display text-h1 text-text">Promotions</h1>
        </div>
        <button
          onClick={createCampaign}
          disabled={saving || !activeOutlet?.id}
          className="h-11 px-5 rounded-xl bg-primary text-white font-label font-bold inline-flex items-center gap-2 disabled:bg-divider disabled:cursor-not-allowed"
        >
          <Plus size={18} weight="bold" />
          {saving ? 'Creating...' : 'New Campaign'}
        </button>
      </header>
      {statusMessage ? <p className="font-body-sm text-text-muted">{statusMessage}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {loading && (
          <article className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm">
            <p className="font-body-sm text-text-muted">Loading promotions...</p>
          </article>
        )}
        {!loading && promos.map((promo) => (
          <article key={promo.code} className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm space-y-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10">
                <Tag size={14} weight="fill" />
                <span className="font-label text-xs font-bold">{promo.code}</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase ${
                promo.status === 'active' ? 'text-success' : 'text-text-muted'
              }`}>
                {promo.status === 'active' ? <CheckCircle size={14} weight="fill" /> : <Pause size={14} weight="bold" />}
                {promo.status}
              </span>
            </div>
            <h2 className="font-h3 text-h3 text-text">{promo.value}</h2>
            <p className="font-body-sm text-text-muted">{promo.usage}</p>
            <p className="font-body-sm text-text-muted inline-flex items-center gap-1.5">
              <Clock size={14} weight="bold" />
              Expires {promo.expiry}
            </p>
            <button
              onClick={() => togglePromoStatus(promo.code, promo.status === 'active' ? 'paused' : 'active')}
              className="h-9 px-3 rounded-lg bg-surface-2 border border-divider text-xs font-bold text-text"
            >
              Mark as {promo.status === 'active' ? 'paused' : 'active'}
            </button>
          </article>
        ))}
        {!loading && promos.length === 0 && (
          <article className="bg-surface rounded-2xl border border-divider p-lg shadow-elevation-sm">
            <p className="font-body-sm text-text-muted">No promotions have been created for this outlet yet.</p>
          </article>
        )}
      </section>
    </main>
  );
}
