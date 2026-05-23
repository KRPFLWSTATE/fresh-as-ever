'use client';

/**
 * Google / Apple sign-in for customer login (Supabase OAuth).
 */
export function SocialAuthButtons({ loading, onGoogle, onApple, showApple = true }) {
  const btn =
    'w-full h-12 rounded-xl border border-divider bg-surface font-label text-label font-bold flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50';

  return (
    <div className="space-y-sm">
      <div className="flex items-center gap-3 my-sm">
        <div className="flex-1 h-px bg-divider" />
        <span className="font-label text-label text-text-muted">Or continue with</span>
        <div className="flex-1 h-px bg-divider" />
      </div>
      <button
        type="button"
        className={btn}
        disabled={loading}
        onClick={onGoogle}
        aria-label="Continue with Google"
      >
        Continue with Google
      </button>
      {showApple ? (
        <button
          type="button"
          className={`${btn} bg-text text-surface border-text`}
          disabled={loading}
          onClick={onApple}
          aria-label="Continue with Apple"
        >
          Continue with Apple
        </button>
      ) : null}
    </div>
  );
}
