import React from 'react';
import styles from './Button.module.css';

export function Button({ 
  children, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '', 
  ...props 
}) {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || styles.md;
  const widthClass = fullWidth ? styles.full : '';

  return (
    <button 
      className={`${styles.button} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}