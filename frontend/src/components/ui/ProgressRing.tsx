import React from 'react';

interface ProgressRingProps {
  /** Percentage value 0–100 */
  percentage: number;
  /** Ring diameter in px */
  size?: number;
  /** Ring track stroke width */
  strokeWidth?: number;
  /** Show milestone markers at 25%, 50%, 75%, 100% */
  showMilestones?: boolean;
  /** Center label: defaults to the percentage */
  label?: React.ReactNode;
  /** Sub-label below main label */
  subLabel?: React.ReactNode;
}

function getStrokeColor(pct: number): string {
  if (pct >= 100) return 'var(--color-success)';
  if (pct >= 75) return 'var(--color-primary-400)';
  if (pct >= 50) return 'var(--color-info)';
  if (pct >= 25) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/**
 * SVG circular progress ring for tracking 120-hour placement progress.
 * Shows colored milestones at 25%, 50%, 75%, and 100%.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  showMilestones = true,
  label,
  subLabel,
}) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;
  const center = size / 2;
  const strokeColor = getStrokeColor(clampedPct);

  // Milestone markers at 25%, 50%, 75%, 100%
  const milestones = [25, 50, 75, 100];

  function getMilestoneCoords(pct: number) {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    const r = radius + strokeWidth / 2 + 3;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="progress-ring-svg"
        aria-label={`Progress: ${clampedPct}%`}
        role="img"
      >
        {/* Track */}
        <circle
          className="progress-ring-track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          className="progress-ring-fill"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
        {/* Milestone markers */}
        {showMilestones &&
          milestones.map((m) => {
            const coords = getMilestoneCoords(m);
            const reached = clampedPct >= m;
            return (
              <circle
                key={m}
                cx={coords.x}
                cy={coords.y}
                r={3}
                fill={reached ? strokeColor : 'var(--surface-border)'}
                stroke="var(--surface-card)"
                strokeWidth={1.5}
              />
            );
          })}
      </svg>
      <div className="progress-ring-label">
        <span
          style={{
            fontSize: size > 100 ? '1.5rem' : '1rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {label ?? `${Math.round(clampedPct)}%`}
        </span>
        {subLabel && (
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              marginTop: 2,
              textAlign: 'center',
            }}
          >
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
