'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminMerchantReviewAliasPage() {
  const router = useRouter();
  const routeParams = useParams();

  useEffect(() => {
    if (routeParams?.id) {
      router.replace(`/admin/merchants/${routeParams.id}`);
    }
  }, [routeParams?.id, router]);

  return null;
}
