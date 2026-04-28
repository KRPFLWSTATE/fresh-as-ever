'use client';
import { useEffect } from 'react';
import ZeroState from '@/components/spatial/ZeroState';
import styles from './error.module.css';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <ZeroState 
          icon="⚡"
          title="System Anomaly"
          description={error?.message || "A kinetic instability has compromised the current substrate. The error has been logged for remediation."}
          action={
            <button onClick={() => reset()} className={`btn btn-primary ${styles.recalibrateBtn}`}>
              Recalibrate Matrix
            </button>
          }
        />
      </div>
    </div>
  );
}
