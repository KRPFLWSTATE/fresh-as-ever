'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { WarningCircle, Leaf } from '@phosphor-icons/react';

export default function BagAllergensPage() {
  const resolvedParams = useParams();
  const { allergens, dietary } = useMemo(() => {
    const text = `${resolvedParams.bagId || ''}`.toLowerCase();
    const detectedAllergens = [];
    if (text.includes('nut')) detectedAllergens.push('Nuts');
    if (text.includes('dairy') || text.includes('cheese') || text.includes('milk')) detectedAllergens.push('Dairy');
    if (text.includes('egg')) detectedAllergens.push('Egg');
    if (text.includes('soy')) detectedAllergens.push('Soy');
    if (text.includes('wheat') || text.includes('bread')) detectedAllergens.push('Gluten');
    const detectedDietary = [];
    if (text.includes('vegan')) detectedDietary.push('Vegan-friendly options');
    if (text.includes('vegetarian')) detectedDietary.push('Vegetarian-friendly options');
    return { allergens: detectedAllergens, dietary: detectedDietary };
  }, [resolvedParams.bagId]);

  return (
    <main className="max-w-2xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <header className="space-y-xs">
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest">Bag Details</p>
        <h1 className="font-display text-h1 text-text">Allergen & Dietary Information</h1>
      </header>
      <section className="bg-surface border border-divider rounded-2xl p-lg space-y-md">
          <h2 className="font-h3 text-h3 text-text">Rescue Bag</h2>
          <div>
            <p className="font-label text-text mb-xs inline-flex items-center gap-2">
              <WarningCircle size={16} weight="fill" className="text-accent" />
              Potential allergens
            </p>
            <p className="font-body-sm text-text-muted">
              {allergens.length > 0 ? allergens.join(', ') : 'Not specified by merchant. Ask on pickup if you have allergies.'}
            </p>
          </div>
          <div>
            <p className="font-label text-text mb-xs inline-flex items-center gap-2">
              <Leaf size={16} weight="fill" className="text-success" />
              Dietary notes
            </p>
            <p className="font-body-sm text-text-muted">
              {dietary.length > 0 ? dietary.join(', ') : 'Dietary suitability varies by day.'}
            </p>
          </div>
          <Link href={`/bags/${resolvedParams.bagId}`} className="inline-flex h-10 px-4 rounded-xl bg-primary text-white font-label font-bold items-center">
            Back to Bag
          </Link>
        </section>
    </main>
  );
}
