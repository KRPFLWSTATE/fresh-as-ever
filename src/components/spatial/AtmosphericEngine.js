'use client';

import styles from './AtmosphericEngine.module.css';

/**
 * AtmosphericEngine
 * 
 * The visual heartbeat of the Zenith Singularity design system.
 * Renders a kinetic mesh gradient with a sub-atomic noise overlay.
 */
export default function AtmosphericEngine() {
  return (
    <div className={styles.engine} aria-hidden="true">
      <div className={styles.blurContainer}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
        <div className={`${styles.blob} ${styles.blob4}`} />
      </div>
      <div className={styles.noise} />
    </div>
  );
}
