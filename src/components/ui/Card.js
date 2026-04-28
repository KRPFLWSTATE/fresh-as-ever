import React from 'react';
import styles from './Card.module.css';

export function Card({ children, interactive = false, padding = 'default', className = '', ...props }) {
  const interactiveClass = interactive ? styles.interactive : '';
  const paddingClass = styles[padding] || styles.default;

  return (
    <div 
      className={`${styles.card} ${paddingClass} ${interactiveClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}