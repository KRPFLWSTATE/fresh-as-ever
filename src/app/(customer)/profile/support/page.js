'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CaretDown, PaperPlaneTilt } from '@phosphor-icons/react';

export default function CustomerSupportPage() {
  const router = useRouter();
  const faqs = [
    { q: 'How does Fresh As Ever work?', a: 'We connect you with local merchants who have surplus food. You can purchase Rescue Bags at discounted prices and pick them up at the store.' },
    { q: 'What is a Rescue Bag?', a: 'A Rescue Bag is a surprise bag of surplus food from a local merchant, offered at a significant discount to prevent food waste.' },
    { q: 'How do I collect my order?', a: 'Show your QR code at the merchant location during the pickup window shown in your order details.' },
    { q: 'Can I get a refund?', a: 'Refund policies vary by merchant. Contact us through the support form below for assistance.' },
  ];
  return (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button onClick={() => router.push('/profile')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm">
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-black text-text tracking-tight">Help & Support</h1>
        </div>
      </div>
      <main className="max-w-lg mx-auto px-page-margin-mobile py-lg space-y-xl">
        <div>
          <h2 className="font-h2 text-h2 text-text mb-md">Frequently Asked Questions</h2>
          <div className="space-y-sm">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-surface rounded-xl p-md shadow-[0_2px_8px_rgba(30,27,20,0.04)] group">
                <summary className="font-label text-label text-text cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <CaretDown size={20} weight="bold" className="text-text-muted group-open:rotate-180 transition-transform" />
                </summary>
                <p className="font-body-md text-body-md text-text-muted mt-md">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="bg-surface rounded-xl p-lg shadow-[0_4px_12px_rgba(30,27,20,0.04)]">
          <h3 className="font-h3 text-h3 text-text mb-md">Still need help?</h3>
          <textarea className="w-full h-24 border border-divider rounded-lg p-md bg-surface text-text font-body-md focus:border-primary-highlight focus:ring-2 focus:ring-primary-highlight focus:outline-none resize-none placeholder:text-text-faint mb-md" placeholder="Describe your issue..." />
          <button className="w-full h-12 bg-primary text-white font-label text-label rounded-lg active:scale-[0.97] transition-transform flex items-center justify-center gap-2">
            <PaperPlaneTilt size={20} weight="bold" />Send Message
          </button>
        </div>
      </main>
    </div>
  );
}