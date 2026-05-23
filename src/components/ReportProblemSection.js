'use client';

import { useCallback, useEffect, useState } from 'react';
import { Warning, Camera, CheckCircle } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { isOpenComplaintStatus } from '@/lib/adminComplaints';
import {
  CUSTOMER_COMPLAINT_TYPE_OPTIONS,
  customerCanReportProblem,
  fetchCustomerComplaintForOrder,
  submitCustomerComplaint,
  uploadComplaintPhoto,
} from '@/lib/complaints';

const MAX_PHOTOS = 3;

export function ReportProblemSection({ orderId, orderStatus }) {
  const [userId, setUserId] = useState(null);
  const [existing, setExisting] = useState(null);
  const [type, setType] = useState('quality');
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const reloadComplaint = useCallback(async (uid) => {
    if (!orderId || !uid) {
      setExisting(null);
      return;
    }
    const row = await fetchCustomerComplaintForOrder(orderId, uid);
    setExisting(row);
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    const sb = createClient();
    (async () => {
      const { data } = await sb.auth.getUser();
      const uid = data.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid || !orderId) {
        setExisting(null);
        return;
      }
      const row = await fetchCustomerComplaintForOrder(orderId, uid);
      if (!cancelled) setExisting(row);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const canReport = customerCanReportProblem(orderStatus, existing);
  const openOnFile = existing && isOpenComplaintStatus(existing.status);

  if (!userId || (!canReport && !openOnFile && !success)) return null;

  const onPhotoPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !userId) return;
    if (photoUrls.length >= MAX_PHOTOS) {
      setError(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadComplaintPhoto(orderId, userId, file);
      setPhotoUrls((prev) => [...prev, url]);
    } catch (e) {
      setError(e?.message ?? 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!userId) return;
    setBusy(true);
    setError(null);
    const result = await submitCustomerComplaint({
      orderId,
      reporterId: userId,
      type,
      description,
      photoUrls,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSuccess(true);
    setExpanded(false);
    await reloadComplaint(userId);
  };

  if (openOnFile || success) {
    return (
      <div className="bg-surface rounded-xl p-md border border-divider flex gap-md items-start">
        <CheckCircle weight="fill" className="w-6 h-6 text-primary shrink-0" />
        <div>
          <p className="font-label text-label text-text">Problem report submitted</p>
          <p className="font-body-sm text-text-muted mt-1">
            Status: {String(existing?.status ?? 'open').replaceAll('_', ' ')}. Our team is
            reviewing your case.
          </p>
        </div>
      </div>
    );
  }

  if (!canReport) return null;

  return (
    <div className="bg-surface rounded-xl p-md border border-divider space-y-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-md text-left"
      >
        <span className="flex items-center gap-sm font-label text-label text-primary">
          <Warning weight="fill" className="w-5 h-5" />
          Report a problem
        </span>
        <span className="font-body-sm text-text-muted">{expanded ? 'Hide' : 'Open'}</span>
      </button>

      {expanded ? (
        <form onSubmit={onSubmit} className="space-y-md">
          <p className="font-body-sm text-text-muted">
            Tell us what went wrong. Add a short description and optional photos.
          </p>

          <fieldset className="space-y-sm">
            <legend className="font-label-caps text-text-muted text-xs mb-sm">Issue type</legend>
            {CUSTOMER_COMPLAINT_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-sm p-sm rounded-lg border border-divider cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-highlight"
              >
                <input
                  type="radio"
                  name="complaint-type"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="accent-primary"
                />
                <span className="font-label text-label">{opt.label}</span>
              </label>
            ))}
          </fieldset>

          <div>
            <label htmlFor="complaint-description" className="font-label-caps text-text-muted text-xs">
              What happened?
            </label>
            <textarea
              id="complaint-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue (at least 10 characters)…"
              className="mt-sm w-full rounded-xl border border-divider p-sm font-body-md bg-background"
            />
          </div>

          <div className="flex flex-wrap gap-sm items-center">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Evidence"
                className="w-20 h-20 rounded-lg object-cover border border-divider"
              />
            ))}
            {photoUrls.length < MAX_PHOTOS ? (
              <label className="w-20 h-20 rounded-lg border border-dashed border-divider flex flex-col items-center justify-center gap-1 cursor-pointer text-text-muted">
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-label-caps">{uploading ? '…' : 'Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading || busy}
                  onChange={onPhotoPick}
                />
              </label>
            ) : null}
          </div>

          {error ? <p className="font-body-sm text-error">{error}</p> : null}

          <button
            type="submit"
            disabled={busy || description.trim().length < 10}
            className="w-full bg-primary text-white font-label py-3 rounded-xl disabled:bg-divider disabled:cursor-not-allowed"
          >
            {busy ? 'Submitting…' : 'Submit report'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
