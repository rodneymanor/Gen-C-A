export const gcDashShape = {
  radiusXl: '20px',
  radiusLg: '16px',
  radiusMd: '12px',
  radiusSm: '10px',
  radiusXs: '8px',
  radiusCard: '12px',
};

export const gcDashSpacing = {
  xxs: 'var(--space-1)',
  xs: 'var(--space-2)',
  sm: 'var(--space-3)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
  xl: 'var(--space-8)',
};

export const gcDashTypography = {
  family: 'var(--font-family-primary, "Inter", system-ui, -apple-system, "Segoe UI", sans-serif)',
  titleWeight: '600',
  bodyWeight: '500',
  labelWeight: '600',
};

export const gcDashColor = {
  primary: 'var(--color-primary-500)',
  primaryHover: 'var(--color-primary-600)',
  primaryActive: 'var(--color-primary-700)',
  textPrimary: 'var(--color-text-primary, #172b4d)',
  textSecondary: 'var(--color-text-secondary, #42526e)',
  textMuted: 'var(--color-text-subtle, #5e6c84)',
  surface: 'var(--color-surface, #ffffff)',
  surfaceAlt: 'var(--color-surface-raised, #f6f8fb)',
  cardBackground: 'var(--gc-dash-card-bg, var(--color-neutral-50, #fafbfc))',
  cardHoverBackground: 'var(--gc-dash-card-hover-bg, var(--color-neutral-0, #ffffff))',
  cardBorder: 'rgba(9, 30, 66, 0.16)',
  cardHoverBorder: 'rgba(11, 92, 255, 0.35)',
  cardActiveBorder: 'rgba(11, 92, 255, 0.55)',
  border: 'var(--color-border, #e4e6ea)',
  borderStrong: 'var(--color-border-strong, #c1c7d0)',
  danger: 'var(--color-error-500)',
  warning: 'var(--color-warning-500)',
  success: 'var(--color-success-500)',
  info: 'var(--color-info-500)',
  overlay: 'rgba(9, 30, 66, 0.08)',
};


export const gcDashMotion = {
  transitionFast: 'all 0.16s ease-out',
  transition: 'all 0.24s ease',
};

export const gcDashFocus = {
  ring: '0 0 0 3px var(--color-primary-100)',
};

export const toRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return hex;
  }
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
