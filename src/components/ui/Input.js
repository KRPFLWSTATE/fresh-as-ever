import React from 'react';
import styles from './Input.module.css';

export function Input({ 
  label, 
  error, 
  id,
  className = '', 
  ...props 
}) {
  return (
    <div className={styles.formGroup}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <input 
        id={id}
        className={`${styles.input} ${error ? styles.error : ''} ${className}`} 
        {...props} 
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}