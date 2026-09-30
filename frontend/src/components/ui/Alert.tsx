import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const iconMap: Record<AlertVariant, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  danger: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

/**
 * Contextual alert component for feedback messages.
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  return (
    <div
      className={clsx('alert', `alert-${variant}`, className)}
      role={variant === 'danger' ? 'alert' : 'status'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
    >
      <span className="alert-icon">{iconMap[variant]}</span>
      <div style={{ flex: 1 }}>
        {title && (
          <p style={{ fontWeight: 600, marginBottom: children ? 4 : 0 }}>{title}</p>
        )}
        {children && (
          <div style={{ opacity: 0.9, fontSize: '0.875rem' }}>{children}</div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'currentColor',
            opacity: 0.7,
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            marginLeft: 4,
          }}
          aria-label="Dismiss alert"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default Alert;
