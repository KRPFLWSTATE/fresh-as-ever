'use client';

import { useEffect } from 'react';
import styles from './error.module.css';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.authErrorContainer}>
      <div className={styles.authErrorCard}>
        <h2 className={styles.authErrorTitle}>Connection Error</h2>
        <p className={styles.authErrorText}>
          We hit an snag connecting to the core servers. The architecture is protected.
        </p>
        <button 
          onClick={() => reset()} 
          className={styles.authErrorBtn}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Initialize Refresh
        </button>
      </div>
    </div>
  );
}
