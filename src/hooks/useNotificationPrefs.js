'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

const DEFAULT_PREFS = { push: true, email: true, sms: false };

export { DEFAULT_PREFS };

export function useNotificationPrefs() {
  const supabase = useMemo(() => createClient(), []);
  const [pushOn, setPushOn] = useState(DEFAULT_PREFS.push);
  const [emailOn, setEmailOn] = useState(DEFAULT_PREFS.email);
  const [smsOn, setSmsOn] = useState(DEFAULT_PREFS.sms);
  const [profilePhone, setProfilePhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const applyPrefs = useCallback((parsed) => {
    if (typeof parsed?.push === 'boolean') setPushOn(parsed.push);
    if (typeof parsed?.email === 'boolean') setEmailOn(parsed.email);
    if (typeof parsed?.sms === 'boolean') setSmsOn(parsed.sms);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user?.id) {
          setUserId(null);
          setLoading(false);
          return;
        }
        setUserId(user.id);
        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('notification_prefs, phone')
          .eq('id', user.id)
          .maybeSingle();
        if (qErr) throw qErr;
        if (typeof data?.phone === 'string') setProfilePhone(data.phone);
        const np = data?.notification_prefs;
        if (np && typeof np === 'object') applyPrefs(np);
      } catch (e) {
        if (!cancelled) setError(mapSupabaseError(e, 'Could not load notification settings.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPrefs, supabase]);

  const persist = useCallback(
    async (next) => {
      if (!userId) return;
      setSaving(true);
      setError(null);
      try {
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ notification_prefs: next })
          .eq('id', userId);
        if (upErr) throw upErr;
      } catch (e) {
        setError(mapSupabaseError(e, 'Could not save notification settings.'));
      } finally {
        setSaving(false);
      }
    },
    [supabase, userId],
  );

  const setPush = useCallback(
    (v) => {
      setPushOn(v);
      void persist({ push: v, email: emailOn, sms: smsOn });
    },
    [emailOn, persist, smsOn],
  );

  const setEmail = useCallback(
    (v) => {
      setEmailOn(v);
      void persist({ push: pushOn, email: v, sms: smsOn });
    },
    [persist, pushOn, smsOn],
  );

  const setSms = useCallback(
    (v) => {
      if (v) {
        const phone = profilePhone.trim();
        if (!phone) {
          setError('Add a phone number under Profile → Details to enable SMS alerts.');
          return;
        }
      }
      setError(null);
      setSmsOn(v);
      void persist({ push: pushOn, email: emailOn, sms: v });
    },
    [emailOn, persist, profilePhone, pushOn],
  );

  return {
    pushOn,
    emailOn,
    smsOn,
    loading,
    saving,
    error,
    setPush,
    setEmail,
    setSms,
  };
}
