'use client';

import { useEffect, useMemo, useState } from 'react';
import { Storefront, Bell, ShieldCheck, MapPin, Phone, Envelope, Clock, Check, NavigationArrow } from '@phosphor-icons/react';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import {
  getCurrentPositionNativeOrWeb,
  isGeolocationAvailable,
} from '@/lib/native/getCurrentPosition';

export default function MerchantSettingsPage() {
  const { merchant, activeOutlet, loading, updateMerchantSettings } = useMerchantContext();
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    setStoreName(merchant?.business_name || activeOutlet?.name || '');
    setAddress(activeOutlet?.address || '');
    setPhone(activeOutlet?.phone || merchant?.phone || '');
    setEmail(activeOutlet?.email || merchant?.email || '');
    setOperatingHours(activeOutlet?.operating_hours || merchant?.operating_hours || '08:00 - 20:00');
    setCoverImageUrl(activeOutlet?.cover_image_url || '');
    setSelectedLocation(activeOutlet?.location || null);
  }, [merchant, activeOutlet]);

  useEffect(() => {
    if (!locationQuery.trim()) {
      setLocationResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsSearchingLocation(true);
        const response = await fetch(`/api/location/search?q=${encodeURIComponent(locationQuery.trim())}`);
        const data = await response.json();
        setLocationResults(data?.results || []);
      } catch (_error) {
        setLocationResults([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [locationQuery]);

  const handleSelectLocation = (location) => {
    setAddress(location.label || '');
    setSelectedLocation({ lat: location.lat, lng: location.lng, label: location.label });
    setLocationQuery('');
    setLocationResults([]);
  };

  const requestPreciseLocation = async () => {
    setError('');
    if (!isGeolocationAvailable()) {
      setError('Precise location is not available on this device.');
      return;
    }

    try {
      const position = await getCurrentPositionNativeOrWeb({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      let label = 'Current location';
      try {
        const response = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
        const data = await response.json();
        label = data?.label || label;
      } catch (_error) {
        // Keep default label.
      }
      setAddress(label);
      setSelectedLocation({ lat, lng, label });
    } catch {
      setError(
        'Unable to get a precise location. Please allow location access or enter an address manually.'
      );
    }
  };

  const onSave = async () => {
    try {
      setIsSaving(true);
      setNotice('');
      setError('');
      await updateMerchantSettings({
        storeName,
        phone,
        email,
        operatingHours,
        address,
        location: selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null,
        coverImageUrl: coverImageUrl.trim() || null,
      });
      setNotice('Store settings updated successfully.');
    } catch (saveError) {
      setError(saveError?.message || 'Could not update store settings right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const storeImage = useMemo(() => coverImageUrl.trim(), [coverImageUrl]);

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      {/* Header */}
      <div className="pt-4">
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Configurations</p>
        <h1 className="font-display text-h1 text-text">Store Settings</h1>
      </div>

      <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm space-y-xl">
        {notice ? <p className="font-body-sm text-success">{notice}</p> : null}
        {error ? <p className="font-body-sm text-error">{error}</p> : null}

        {/* Profile Section */}
        <div className="flex items-center gap-xl pb-xl border-b border-divider">
          {storeImage ? (
            <img
              src={storeImage}
              alt={storeName || 'Store profile'}
              className="w-20 h-20 rounded-[2rem] object-cover border border-primary/10 shadow-inner"
            />
          ) : (
            <div className="w-20 h-20 rounded-[2rem] bg-primary-highlight flex items-center justify-center text-primary border border-primary/10 shadow-inner">
              <Storefront size={40} weight="fill" />
            </div>
          )}
          <div>
            <h2 className="font-h3 text-h3 text-text">{storeName || 'Store'}</h2>
            <p className="font-body-sm text-text-muted flex items-center gap-1.5 mt-1">
              <MapPin size={16} weight="bold" />
              {address || 'Address not set'}
            </p>
          </div>
        </div>

        <div className="space-y-2 group">
          <label className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Store Profile Image URL</label>
          <div className="relative">
            <Storefront size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint group-focus-within:text-primary transition-colors" />
            <input
              className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner"
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              placeholder="https://example.com/store-image.jpg"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {[
            { l: 'Store Name', value: storeName, setValue: setStoreName, i: Storefront },
            { l: 'Phone', value: phone, setValue: setPhone, i: Phone },
            { l: 'Email', value: email, setValue: setEmail, i: Envelope },
            { l: 'Operating Hours', value: operatingHours, setValue: setOperatingHours, i: Clock }
          ].map((f, i) => {
            const Icon = f.i;
            return (
              <div key={i} className="space-y-2 group">
                <label className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">{f.l}</label>
                <div className="relative">
                  <Icon size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint group-focus-within:text-primary transition-colors" />
                  <input 
                    className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner" 
                    value={f.value}
                    onChange={(event) => f.setValue(event.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 group">
          <label className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Address</label>
          <div className="relative">
            <MapPin size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint group-focus-within:text-primary transition-colors" />
            <input
              className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setSelectedLocation(null);
              }}
              placeholder="Enter manual address"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px bg-divider flex-1" />
            <span className="font-label text-xs text-text-faint uppercase tracking-wider">or</span>
            <div className="h-px bg-divider flex-1" />
          </div>

          <div className="space-y-2">
            <input
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="Search precise location by area"
              className="w-full bg-surface-2 border border-divider rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary"
            />
            {isSearchingLocation ? <p className="font-body-sm text-text-muted">Searching...</p> : null}
            {locationResults.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border border-divider rounded-xl">
                {locationResults.map((option) => (
                  <button
                    key={`${option.label}-${option.lat}-${option.lng}`}
                    type="button"
                    onClick={() => handleSelectLocation(option)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 border-b border-divider last:border-b-0"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={requestPreciseLocation}
            className="w-full h-12 bg-surface-2 border border-divider text-text font-label font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <NavigationArrow size={18} weight="bold" />
            Use precise location
          </button>
        </div>

        <button
          onClick={onSave}
          disabled={loading || isSaving}
          className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-label font-bold rounded-2xl shadow-elevation-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-divider disabled:cursor-not-allowed"
        >
          <Check size={20} weight="bold" />
          {isSaving ? 'Updating...' : 'Update Information'}
        </button>
      </div>

      {/* Preferences Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm">
          <div className="flex items-center gap-3 mb-xl">
            <div className="w-10 h-10 rounded-xl bg-accent-highlight text-accent flex items-center justify-center border border-accent/10">
              <Bell size={20} weight="fill" />
            </div>
            <h3 className="font-h3 text-h3 text-text">Notifications</h3>
          </div>
          
          <div className="space-y-lg">
            {[
              { l: 'New Orders', d: 'Get alerted on incoming rescue bags', on: true },
              { l: 'Payouts', d: 'Updates on bank settlements', on: true },
              { l: 'Reviews', d: 'Customer feedback alerts', on: false }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div>
                  <p className="font-label text-sm font-bold text-text">{p.l}</p>
                  <p className="font-body-sm text-[11px] text-text-muted">{p.d}</p>
                </div>
                <button className={`w-14 h-8 rounded-full transition-all relative border ${p.on ? 'bg-success border-success/20 shadow-elevation-sm' : 'bg-surface-2 border-divider'}`}>
                  <div className={`w-6 h-6 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${p.on ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-xl">
            <div className="w-10 h-10 rounded-xl bg-primary-highlight text-primary flex items-center justify-center border border-primary/10">
              <ShieldCheck size={20} weight="fill" />
            </div>
            <h3 className="font-h3 text-h3 text-text">Security</h3>
          </div>
          
          <p className="font-body-sm text-text-muted mb-xl">Keep your account secure by enabling two-factor authentication and regularly updating your password.</p>
          
          <button className="w-full py-3.5 border border-divider text-text-muted font-label font-bold rounded-2xl hover:bg-surface-2 hover:text-text transition-all">
            Change Password
          </button>
        </div>
      </div>
    </main>
  );
}