import React from 'react';
import clsx from 'clsx';

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  label?: string;
}

/**
 * Animated SVG spinner for loading states.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 24,
  color = 'var(--color-primary-400)',
  className,
  label = 'Loading...',
}) => {
  return (
    <span
      role="status"
      aria-label={label}
      className={clsx('inline-flex items-center justify-center', className)}
      style={{ width: size, height: size, display: 'inline-flex' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'spin 0.7s linear infinite' }}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          opacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};

/**
 * Full-page loading overlay.
 */
export const PageLoader: React.FC<{ label?: string }> = ({
  label = 'Loading...',
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-bg)',
        zIndex: 100,
        gap: 16,
      }}
      role="status"
      aria-label={label}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
          marginBottom: 8,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>
          E8
        </span>
      </div>
      <Spinner size={32} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</p>
    </div>
  );
};

export default Spinner;
