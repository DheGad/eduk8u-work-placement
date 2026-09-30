import React from 'react';
import clsx from 'clsx';

interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'active' | 'pending';
  date?: string;
  icon?: React.ReactNode;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

/**
 * Vertical timeline showing placement phase progression.
 * Each step can be completed, active, or pending.
 */
export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  steps,
  className,
}) => {
  return (
    <ol className={clsx('timeline', className)} aria-label="Placement timeline">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={step.id} className="timeline-item">
            <div className="timeline-indicator">
              <div className={clsx('timeline-dot', step.status)} aria-hidden="true" />
              {!isLast && (
                <div
                  className={clsx(
                    'timeline-line',
                    step.status === 'completed' && 'completed',
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {step.icon && (
                    <span
                      style={{
                        color:
                          step.status === 'completed'
                            ? 'var(--color-success)'
                            : step.status === 'active'
                            ? 'var(--color-primary-400)'
                            : 'var(--text-muted)',
                      }}
                    >
                      {step.icon}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color:
                        step.status === 'pending'
                          ? 'var(--text-muted)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {step.date && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {step.date}
                  </span>
                )}
              </div>
              {step.description && (
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default StatusTimeline;
