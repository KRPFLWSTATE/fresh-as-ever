'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Image, Trash, Check, Tag, Clock, Coins, Hash, TextColumns, Camera } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantBags } from '@/hooks/useMerchantBags';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import { uploadBagImage } from '@/lib/uploadBagImage';

export default function EditBagPage() {
  const resolvedParams = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { updateBag, deleteBag } = useMerchantBags();
  const { merchant } = useMerchantContext();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'bakery',
    retail_value_estimate: '',
    rescue_price: '',
    quantity_remaining: '1',
    pickup_start: '',
    pickup_end: '',
    image_url: '',
  });

  const categoryOptions = [
    { value: 'bakery', label: 'Bakery Surprise Bag' },
    { value: 'cafe', label: 'Cafe Surprise Bag' },
    { value: 'mixed_meals', label: 'Mixed Meals Surprise Bag' },
    { value: 'groceries', label: 'Supermarket Essentials Bag' },
    { value: 'other', label: 'Custom Surprise Bag' },
  ];

  const toLocalDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    const loadBag = async () => {
      try {
        setLoading(true);
        const { data, error: loadError } = await supabase
          .from('rescue_bags')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();
        if (loadError) throw loadError;
        setForm({
          title: data.title || '',
          description: data.notes || '',
          category: data.category || 'other',
          retail_value_estimate: String(data.retail_value_estimate || ''),
          rescue_price: String(data.rescue_price || ''),
          quantity_remaining: String(data.quantity_remaining || 1),
          pickup_start: toLocalDateTime(data.pickup_start),
          pickup_end: toLocalDateTime(data.pickup_end),
          image_url: data.image_url || '',
        });
      } catch (_error) {
        setError('Could not load bag details.');
      } finally {
        setLoading(false);
      }
    };

    loadBag();
  }, [resolvedParams.id, supabase]);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onPickImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !merchant?.id) return;
    setUploading(true);
    setError('');
    const result = await uploadBagImage(file, String(merchant.id));
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onChange('image_url', result.publicUrl);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setError('');
      await updateBag(resolvedParams.id, {
        title: form.title,
        notes: form.description,
        category: form.category,
        retail_value_estimate: Number(form.retail_value_estimate),
        rescue_price: Number(form.rescue_price),
        quantity_total: Number(form.quantity_remaining),
        quantity_remaining: Number(form.quantity_remaining),
        pickup_start: new Date(form.pickup_start).toISOString(),
        pickup_end: new Date(form.pickup_end).toISOString(),
        image_url: form.image_url || null,
      });
      router.push('/merchant/bags');
    } catch (_error) {
      setError('Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      await deleteBag(resolvedParams.id);
      router.push('/merchant/bags');
    } catch (_error) {
      setError('Could not delete bag.');
    }
  };

  if (loading) {
    return <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop">Loading bag...</main>;
  }

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
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Inventory Update</p>
          <h1 className="font-display text-h1 text-text">Edit Rescue Bag</h1>
        </div>
      </div>

      <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm space-y-xl">
        {/* Image Preview Area */}
        <div className="w-full aspect-video rounded-[2.5rem] bg-surface-2 overflow-hidden relative border border-divider group">
          {form.image_url ? (
            <img src={form.image_url} alt={form.title || 'Bag'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-2">
              <Image size={80} weight="thin" className="text-text-faint opacity-30" />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickImage}
        />
        <button
          type="button"
          disabled={uploading || !merchant?.id}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 rounded-2xl border border-primary/30 bg-primary/5 font-label font-bold text-primary disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Camera size={20} weight="bold" />
          {uploading ? 'Uploading…' : 'Upload new photo'}
        </button>
        <input
          className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner"
          placeholder="Or paste image URL (https://…)"
          value={form.image_url}
          onChange={(event) => onChange('image_url', event.target.value)}
        />

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {[
              { l: 'Bag Title', i: Tag, full: true },
              { l: 'Description', i: TextColumns, ta: true, full: true },
              { l: 'Category', i: Tag, select: true },
              { l: 'Original Value (Rs.)', t: 'number', i: Coins },
              { l: 'Rescue Price (Rs.)', t: 'number', i: Coins },
              { l: 'Quantity Available', t: 'number', i: Hash },
              { l: 'Pickup Start', t: 'datetime-local', i: Clock },
              { l: 'Pickup End', t: 'datetime-local', i: Clock }
          ].map((f, i) => {
            const Icon = f.i;
              const keyMap = {
                'Bag Title': 'title',
                Description: 'description',
                Category: 'category',
                'Original Value (Rs.)': 'retail_value_estimate',
                'Rescue Price (Rs.)': 'rescue_price',
                'Quantity Available': 'quantity_remaining',
                'Pickup Start': 'pickup_start',
                'Pickup End': 'pickup_end',
              };
              const fieldKey = keyMap[f.l];
            return (
              <div key={i} className={`space-y-2 group ${f.full ? 'md:col-span-2' : ''}`}>
                <label className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">{f.l}</label>
                <div className="relative">
                  <Icon size={18} weight="bold" className="absolute left-4 top-4 text-text-faint pointer-events-none" />
                  {f.ta ? (
                    <textarea 
                      className="w-full h-32 bg-surface-2 border border-divider rounded-2xl pt-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner resize-none" 
                      value={form[fieldKey]}
                      onChange={(event) => onChange(fieldKey, event.target.value)}
                    />
                  ) : f.select ? (
                    <select
                      className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner"
                      value={form.category}
                      onChange={(event) => onChange('category', event.target.value)}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner" 
                      value={form[fieldKey]}
                      type={f.t || 'text'} 
                      onChange={(event) => onChange(fieldKey, event.target.value)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {error ? <p className="font-body-sm text-error">{error}</p> : null}

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-md pt-4">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-[2] h-16 bg-primary hover:bg-primary-hover disabled:bg-divider disabled:cursor-not-allowed text-white font-display text-lg font-black rounded-2xl shadow-elevation-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-primary/20"
          >
            <Check size={28} weight="bold" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onDelete} className="flex-1 h-16 border-2 border-error/20 text-error hover:bg-error hover:text-white font-label font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group">
            <Trash size={24} weight="bold" className="group-hover:animate-bounce" />
            Delete Listing
          </button>
        </div>
      </div>
    </main>
  );
}