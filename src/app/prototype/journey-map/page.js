import Link from 'next/link';

export default function PrototypeJourneyMapPage() {
  const steps = [
    'Landing -> Login',
    'Onboarding -> Discover',
    'Bag Detail -> Checkout',
    'Reservation Success -> Order Detail',
    'Merchant Verification -> Collected',
  ];

  return (
    <main className="max-w-4xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <header>
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Prototype</p>
        <h1 className="font-display text-h1 text-text">Journey Map</h1>
      </header>
      <section className="bg-surface border border-divider rounded-3xl p-xl shadow-elevation-sm space-y-sm">
        {steps.map((step) => (
          <div key={step} className="p-3 rounded-xl bg-surface-2 border border-divider font-label text-text">
            {step}
          </div>
        ))}
      </section>
      <Link href="/discover" className="inline-flex h-11 px-5 rounded-xl bg-primary text-white font-label font-bold items-center">
        Open Discover
      </Link>
    </main>
  );
}
