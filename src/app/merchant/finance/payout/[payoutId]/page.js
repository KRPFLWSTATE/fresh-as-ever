'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MerchantPayoutAliasPage() {
  const router = useRouter();
  const routeParams = useParams();

  useEffect(() => {
    if (routeParams?.payoutId) {
      router.replace(`/merchant/payouts/${routeParams.payoutId}`);
    }
  }, [routeParams?.payoutId, router]);

  return null;
}
