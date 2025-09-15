import React from 'react';

interface AnimatedCircularProgressProps {
  value: number; // 0 - 100
  size?: number; // px
  strokeWidth?: number; // px
  trackColor?: string;
  progressColor?: string;
  label?: React.ReactNode;
}

export const AnimatedCircularProgress: React.FC<AnimatedCircularProgressProps> = ({
  value,
  size = 96,
  strokeWidth = 8,
  trackColor = 'var(--color-border, #e4e6ea)',
  progressColor = 'var(--color-primary-500, #0B5CFF)',
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 400ms ease',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          color: 'var(--color-text-primary, #172b4d)'
        }}
      >
        {label ?? Math.round(clamped)}
      </div>
    </div>
  );
};

