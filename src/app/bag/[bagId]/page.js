'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function BagAliasPage() {
  const router = useRouter();
  const routeParams = useParams();

  useEffect(() => {
    if (routeParams?.bagId) {
      router.replace(`/bags/${routeParams.bagId}`);
    }
  }, [routeParams?.bagId, router]);

  return null;
}
