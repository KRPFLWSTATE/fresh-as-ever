import Link from 'next/link';

export default function WaitlistSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-page-margin-mobile">
      <section className="w-full max-w-md bg-surface border border-divider rounded-3xl p-xl text-center space-y-md shadow-elevation-sm">
        <h1 className="font-display text-h1 text-text">You are on the waitlist!</h1>
        <p className="font-body-md text-text-muted">
          Thanks for joining Fresh As Ever. We will notify you when your area is fully live.
        </p>
        <Link
          href="/discover"
          className="inline-flex h-11 px-5 rounded-xl bg-primary text-white font-label font-bold items-center justify-center"
        >
          Continue to Discover
        </Link>
      </section>
    </main>
  );
}
