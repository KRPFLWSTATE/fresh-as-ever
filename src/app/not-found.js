import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="stub-page">
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/" style={{ marginTop: '1rem', color: '#01696f', fontWeight: 600 }}>
        Go home
      </Link>
    </div>
  );
}
