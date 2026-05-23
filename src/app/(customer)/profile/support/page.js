'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CaretDown, EnvelopeSimple, WhatsappLogo, Phone } from '@phosphor-icons/react';
import { SUPPORT_FAQS, SUPPORT_MAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '@/content/supportFaqs';

export default function CustomerSupportPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPPORT_FAQS;
    return SUPPORT_FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
    );
  }, [query]);

  const mailHref = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent('Fresh As Ever support')}`;
  const waHref = `https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`;
  const telHref = `tel:${SUPPORT_PHONE}`;

  return (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-black text-text tracking-tight">Help & Support</h1>
        </div>
      </div>
      <main className="max-w-lg mx-auto px-page-margin-mobile py-lg space-y-xl pb-32">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help (pickup, PayHere, refund…)"
          className="w-full h-12 px-md rounded-xl border border-divider bg-surface font-body-md text-text"
        />

        <div>
          <h2 className="font-h2 text-h2 text-text mb-md">Frequently asked questions</h2>
          <div className="space-y-sm">
            {filtered.map((faq) => (
              <details
                key={faq.id}
                className="bg-surface rounded-xl p-md shadow-[0_2px_8px_rgba(30,27,20,0.04)] group"
              >
                <summary className="font-label text-label text-text cursor-pointer list-none flex justify-between items-center">
                  {faq.question}
                  <CaretDown
                    size={20}
                    weight="bold"
                    className="text-text-muted group-open:rotate-180 transition-transform"
                  />
                </summary>
                <p className="font-body-md text-body-md text-text-muted mt-md">{faq.answer}</p>
              </details>
            ))}
            {filtered.length === 0 && (
              <p className="font-body-sm text-text-muted">Nothing matched. Try email or WhatsApp below.</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl p-lg shadow-[0_4px_12px_rgba(30,27,20,0.04)] space-y-md">
          <h3 className="font-h3 text-h3 text-text">Contact us</h3>
          <p className="font-body-sm text-text-muted">
            Include your order code (#FAE-…) for faster help.
          </p>
          <div className="flex flex-col gap-sm">
            <a
              href={mailHref}
              className="flex items-center gap-md h-12 px-md rounded-lg border border-divider font-label text-label text-text hover:bg-surface-2"
            >
              <EnvelopeSimple size={22} weight="bold" className="text-primary" />
              Email {SUPPORT_MAIL}
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-md h-12 px-md rounded-lg border border-divider font-label text-label text-text hover:bg-surface-2"
            >
              <WhatsappLogo size={22} weight="bold" className="text-primary" />
              WhatsApp
            </a>
            <a
              href={telHref}
              className="flex items-center gap-md h-12 px-md rounded-lg border border-divider font-label text-label text-text hover:bg-surface-2"
            >
              <Phone size={22} weight="bold" className="text-primary" />
              Call support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
