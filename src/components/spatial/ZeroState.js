import styles from './ZeroState.module.css';

/**
 * Zenith Pristine Zero-State Component
 * Used for empty carts, no orders, or blank profiles.
 */
export default function ZeroState({ icon, title, description, action }) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
        <div className={styles.iconRefraction}></div>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && (
        <div className={styles.action}>
          {action}
        </div>
      )}
    </div>
  );
}
