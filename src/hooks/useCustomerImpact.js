'use client';

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { co2eKgFromBagRescue, co2eKgFromShelfOrderItems } from '@/lib/co2Impact';

export { KG_CO2E_PER_KG_FOOD } from '@/lib/co2Impact';

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
          `quantity, total, order_status, shelf_id,
          bag:rescue_bags(estimated_weight_kg, retail_value_estimate, rescue_price),
          order_items (
            quantity, line_total, unit_price,
            product:product_catalog (weight_grams)
          )`
        )
        .eq('customer_id', user.id)
        .eq('order_status', 'collected');

      if (error) throw error;

      let rescueCount = 0;
      let saved = 0;
      let co2Total = 0;
      for (const row of data || []) {
        if (row.shelf_id) {
          rescueCount += 1;
          co2Total += co2eKgFromShelfOrderItems(row.order_items);
          for (const line of row.order_items || []) {
            const lineTotal = Number(line.line_total) || 0;
            const unit = Number(line.unit_price) || 0;
            const qty = Math.max(1, Number(line.quantity) || 1);
            saved += lineTotal > 0 ? lineTotal : unit * qty;
          }
        } else {
          const q = Math.max(1, Number(row.quantity) || 1);
          rescueCount += q;
          co2Total += co2eKgFromBagRescue(row.bag, q);
          const retail = Number(row.bag?.retail_value_estimate) || 0;
          const rescue = Number(row.bag?.rescue_price) || 0;
          if (retail > 0 && rescue >= 0) {
            saved += Math.max(0, retail - rescue) * q;
          }
        }
      }
      const roundedCo2 = Math.round(co2Total * 10) / 10;
      setBags(rescueCount);
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

  return {
    rescuesCount: bags,
    bagsRescued: bags,
    co2SavedKg: co2Kg,
    totalSavedRs: savedRupees,
    loading,
    refetch,
  };
}
