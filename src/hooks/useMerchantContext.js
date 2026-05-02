'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useMerchantContext() {
  const [merchant, setMerchant] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [activeOutletId, setActiveOutletId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Fetch merchant
      const { data: merchantRows, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (merchantError) throw merchantError;

      const merchantData = merchantRows?.[0] || null;
      if (merchantData) {
        setMerchant(merchantData);
        // Fetch outlets
        const { data: outletsData, error: outletsError } = await supabase
          .from('outlets')
          .select('*')
          .eq('merchant_id', merchantData.id);
        
        if (outletsError) throw outletsError;
        const nextOutlets = outletsData || [];
        setOutlets(nextOutlets);
        if (nextOutlets.length > 0) {
          setActiveOutletId((previousId) => {
            if (previousId && nextOutlets.some((outlet) => outlet.id === previousId)) return previousId;
            return nextOutlets[0].id;
          });
        } else {
          setActiveOutletId(null);
        }
      } else {
        setMerchant(null);
        setOutlets([]);
        setActiveOutletId(null);
      }
    } catch (err) {
      console.error('Error fetching merchant context:', err);
      setError('Failed to load merchant details');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const activeOutlet = useMemo(
    () => outlets.find((outlet) => outlet.id === activeOutletId) || outlets[0] || null,
    [outlets, activeOutletId]
  );
  const outletScopeIds = useMemo(() => outlets.map((outlet) => outlet.id), [outlets]);

  const updateMerchantSettings = useCallback(
    async ({
      storeName,
      phone,
      email,
      operatingHours,
      address,
      location,
      coverImageUrl,
    }) => {
      if (!merchant?.id || !activeOutlet?.id) {
        throw new Error('Merchant context is unavailable.');
      }

      const merchantPatch = {};
      if (Object.prototype.hasOwnProperty.call(merchant, 'business_name') && storeName !== undefined) merchantPatch.business_name = storeName;
      if (Object.prototype.hasOwnProperty.call(merchant, 'phone') && phone !== undefined) merchantPatch.phone = phone;
      if (Object.prototype.hasOwnProperty.call(merchant, 'email') && email !== undefined) merchantPatch.email = email;
      if (Object.prototype.hasOwnProperty.call(merchant, 'operating_hours') && operatingHours !== undefined) merchantPatch.operating_hours = operatingHours;

      const outletPatch = {};
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'name') && storeName !== undefined) outletPatch.name = storeName;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'address') && address !== undefined) outletPatch.address = address;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'location') && location !== undefined) outletPatch.location = location;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'cover_image_url') && coverImageUrl !== undefined) outletPatch.cover_image_url = coverImageUrl;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'phone') && phone !== undefined) outletPatch.phone = phone;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'email') && email !== undefined) outletPatch.email = email;
      if (Object.prototype.hasOwnProperty.call(activeOutlet, 'operating_hours') && operatingHours !== undefined) outletPatch.operating_hours = operatingHours;

      if (Object.keys(merchantPatch).length > 0) {
        const { error: merchantUpdateError } = await supabase
          .from('merchants')
          .update(merchantPatch)
          .eq('id', merchant.id);
        if (merchantUpdateError) throw merchantUpdateError;
      }

      if (Object.keys(outletPatch).length > 0) {
        const { error: outletUpdateError } = await supabase
          .from('outlets')
          .update(outletPatch)
          .eq('id', activeOutlet.id);
        if (outletUpdateError) throw outletUpdateError;
      }

      await fetchContext();
      return true;
    },
    [merchant, activeOutlet, supabase, fetchContext]
  );

  return {
    merchant,
    outlets,
    activeOutlet,
    activeOutletId: activeOutlet?.id || null,
    outletScopeIds,
    setActiveOutletId,
    updateMerchantSettings,
    loading,
    error,
    refetch: fetchContext
  };
}
