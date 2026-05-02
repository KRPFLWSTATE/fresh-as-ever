'use client';

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Matches marketing copy on bag detail (approx. CO₂ per rescued bag). */
export const KG_CO2_PER_RESCUED_BAG = 1.2;

/**
 * Completed rescues only (`collected`): bag count, estimated CO₂, money saved vs retail.
 */
export function useCustomerImpact() {
  const [bags, setBags] = useState(0);
  const [co2Kg, setCo2Kg] = useState(0);
  const [savedRupees, setSavedRupees] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setBags(0);
        setCo2Kg(0);
        setSavedRupees(0);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(
          `quantity, total, order_status, bag:rescue_bags(retail_value_estimate, rescue_price)`
        )
        .eq('customer_id', user.id)
        .eq('order_status', 'collected');

      if (error) throw error;

      let bagUnits = 0;
      let saved = 0;
      for (const row of data || []) {
        const q = Math.max(1, Number(row.quantity) || 1);
        bagUnits += q;
        const retail = Number(row.bag?.retail_value_estimate) || 0;
        const rescue = Number(row.bag?.rescue_price) || 0;
        if (retail > 0 && rescue >= 0) {
          saved += Math.max(0, retail - rescue) * q;
        }
      }
      const roundedCo2 = Math.round(bagUnits * KG_CO2_PER_RESCUED_BAG * 10) / 10;
      setBags(bagUnits);
      setCo2Kg(roundedCo2);
      setSavedRupees(Math.round(saved));
    } catch (_e) {
      setBags(0);
      setCo2Kg(0);
      setSavedRupees(0);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    startTransition(() => {
      refetch();
    });
  }, [refetch]);

  return { bagsRescued: bags, co2SavedKg: co2Kg, totalSavedRs: savedRupees, loading, refetch };
}
