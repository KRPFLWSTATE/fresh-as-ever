'use client';
import Link from 'next/link';
import ZeroState from '@/components/spatial/ZeroState';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundCard}>
        <ZeroState 
          icon="404"
          title="Coordinate Lost"
          description="The nexus point you requested has been redacted or never existed in the spatial substrate."
          action={
            <Link href="/" className="btn btn-primary">
              Return to Nexus
            </Link>
          }
        />
      </div>
    </div>
  );
}
