import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="stub-page">
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/" className="mt-4 text-primary font-semibold">
        Go home
      </Link>
    </div>
  );
}
