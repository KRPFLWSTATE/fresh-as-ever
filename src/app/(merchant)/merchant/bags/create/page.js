'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Images, PlusCircle, Tag, Clock, Coins, Hash, TextColumns } from '@phosphor-icons/react';
import { useMerchantBags } from '@/hooks/useMerchantBags';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import { uploadBagImage } from '@/lib/uploadBagImage';

export default function CreateBagPage() {
  const router = useRouter();
  const { createBag, activeOutlet } = useMerchantBags();
  const { merchant } = useMerchantContext();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'bakery',
    retail_value_estimate: '',
    rescue_price: '',
    quantity_remaining: '5',
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

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.title || !form.retail_value_estimate || !form.rescue_price || !form.pickup_start || !form.pickup_end) {
      setError('Please complete all required fields.');
      return;
    }

    try {
      setSaving(true);
      await createBag({
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
        status: 'live',
      });
      router.push('/merchant/bags');
    } catch (_error) {
      setError('Could not create rescue bag. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Inventory Listing</p>
          <h1 className="font-display text-h1 text-text">Create Rescue Bag</h1>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm space-y-xl">
        {/* Image Upload Area */}
        <div className="w-full aspect-video rounded-[2.5rem] border-2 border-dashed border-divider bg-surface-2 flex flex-col items-center justify-center transition-all group overflow-hidden relative">
          {form.image_url ? (
            <img src={form.image_url} alt="Bag preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-[url('https://www.transparenttextures.com/patterns/graph-paper.png')]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center mb-md shadow-elevation-md group-hover:scale-110 transition-transform">
                  <Images size={32} weight="bold" className="text-primary" />
                </div>
                <p className="font-display text-xl font-bold text-text mb-1">Add Bag Media</p>
                <p className="font-label text-xs font-bold text-text-faint uppercase tracking-wider">
                  Upload a photo or paste a URL below
                </p>
              </div>
            </>
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
          className="w-full py-3 rounded-2xl border border-primary/30 bg-primary/5 font-label font-bold text-primary disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload from device'}
        </button>
        <input
          className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner placeholder:text-text-faint/50"
          placeholder="Or paste image URL (https://…)"
          value={form.image_url}
          onChange={(event) => onChange('image_url', event.target.value)}
        />

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {[
            { l: 'Bag Title', p: 'e.g. Evening Pastry Surprise', i: Tag, full: true },
            { l: 'Description', p: 'What might be in the bag? (Estimated contents)', i: TextColumns, ta: true, full: true },
            { l: 'Category', p: 'Bakery, Cafe, Grocery...', i: Tag, select: true },
            { l: 'Original Value', p: '1500', t: 'number', i: Coins },
            { l: 'Rescue Price', p: '500', t: 'number', i: Coins },
            { l: 'Quantity', p: '5', t: 'number', i: Hash },
            { l: 'Pickup Start', p: '', t: 'datetime-local', i: Clock },
            { l: 'Pickup End', p: '', t: 'datetime-local', i: Clock }
          ].map((f, i) => {
            const Icon = f.i;
            const keyMap = {
              'Bag Title': 'title',
              Description: 'description',
              Category: 'category',
              'Original Value': 'retail_value_estimate',
              'Rescue Price': 'rescue_price',
              Quantity: 'quantity_remaining',
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
                      className="w-full h-32 bg-surface-2 border border-divider rounded-2xl pt-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner resize-none placeholder:text-text-faint/50" 
                      placeholder={f.p} 
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
                      className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner placeholder:text-text-faint/50" 
                      placeholder={f.p} 
                      type={f.t || 'text'} 
                      value={form[fieldKey]}
                      onChange={(event) => onChange(fieldKey, event.target.value)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {error ? <p className="font-body-sm text-error">{error}</p> : null}

        {/* Submit Action */}
        <button
          type="submit"
          disabled={saving || !activeOutlet}
          className="w-full h-16 bg-primary hover:bg-primary-hover disabled:bg-divider disabled:cursor-not-allowed text-white font-display text-lg font-black rounded-2xl shadow-elevation-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-primary/20"
        >
          <PlusCircle size={28} weight="bold" />
          {saving ? 'Creating...' : !activeOutlet ? 'Loading outlet...' : 'Launch Rescue Bag'}
        </button>
      </form>
    </main>
  );
}

