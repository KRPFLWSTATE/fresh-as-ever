/** Web mirror of mobile `supportFaqs.ts` — keep copy aligned. */

export const SUPPORT_FAQS = [
  {
    id: 'reserve',
    category: 'order',
    question: 'How do I grab a rescue bag?',
    answer:
      'Find a bag on Discover, hit Reserve Now, and pay with card (PayHere) or cash at pickup when you are eligible. Your order gets a 6-digit code and a QR — show either at the counter.',
  },
  {
    id: 'pickup-window',
    category: 'order',
    question: 'When should I show up?',
    answer:
      'Every bag has a pickup window on the listing and on your order. Please arrive inside that window — outlets prep around those times, not all day.',
  },
  {
    id: 'verification',
    category: 'order',
    question: 'What do I show staff?',
    answer:
      'Orders → your active pickup. Flash the QR or read the 6-character code so they can authorize the handover in the merchant app.',
  },
  {
    id: 'cancel',
    category: 'order',
    question: 'Can I cancel if plans change?',
    answer:
      'While the order is still reserved or paid and before the pickup window ends, open Order detail and tap Cancel. Refunds follow your payment method (card refunds go back via PayHere).',
  },
  {
    id: 'payhere',
    category: 'payment',
    question: 'Card payment (PayHere)',
    answer:
      'Checkout opens a secure PayHere sheet. When payment succeeds you land back in the app and the order moves to paid/ready. If it fails, nothing is charged — try again or pick another method.',
  },
  {
    id: 'refund',
    category: 'payment',
    question: 'Refunds and failed charges',
    answer:
      'Failed card attempts should not debit you. Approved refunds for cancelled or disputed orders are processed back to the original card where possible — timing depends on your bank.',
  },
  {
    id: 'support-email',
    category: 'general',
    question: 'How do I reach support?',
    answer:
      'Email hello@freshasever.com or WhatsApp us from this page. Include your order code for faster help.',
  },
];

export const SUPPORT_MAIL = 'hello@freshasever.com';
export const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+94770000000';
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+94770000000';
