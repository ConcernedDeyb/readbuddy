'use client';

import { ReactNode, CSSProperties, useState, useEffect, Component, ErrorInfo } from 'react';
import { createPortal } from 'react-dom';
import { PhilIRILevel } from './types';
import { INK, MUTED, CREAM, TAN_BORDER, TAN_LIGHT, MARIGOLD_BG, FONT_SANS, FONT_MONO, FONT_SERIF } from './constants';
import styles from './shared.module.css';

/* ─── Card (Soft-Neobrutalism) ─── */
export function Card({
  children,
  className = '',
  hoverable = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rb-card ${hoverable ? 'rb-card-interactive' : ''} px-5 py-4 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ─── Primary Button (Tactile 3D Soft-Neobrutalism) ─── */
export function PrimaryButton({
  children,
  onClick,
  accent,
  type = 'button',
  disabled = false,
  className = '',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  accent: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const darkBorder =
    accent === '#E8873A'
      ? '#9C4B0E'
      : accent === '#3D6B8A'
      ? '#1D3D53'
      : accent === '#7A4A6B'
      ? '#48233C'
      : accent === '#2E7D4F'
      ? '#174A2E'
      : '#133326';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rb-action ${styles.primaryButton} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accent}, ${accent}EE)`,
        borderColor: darkBorder,
        boxShadow: disabled ? 'none' : `3px 3px 0px ${darkBorder}`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ─── Ghost Button ─── */
export function GhostButton({
  children,
  onClick,
  className = '',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={`rb-action ${styles.ghostButton} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

/* ─── Section Header ─── */
export function SectionHeader({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle?: string;
  accent: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <div
        className={`${styles.sectionAccent} rb-fade-in-up`}
        style={{
          background: `linear-gradient(90deg, ${accent}, ${accent}AA)`,
          borderColor: accent,
        }}
      />
      <h1 className={styles.sectionTitle}>
        {title}
      </h1>
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    </div>
  );
}

/* ─── Stat Card ─── */
export function StatCard({
  label,
  value,
  accent,
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  accent: string;
  icon?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`${onClick ? 'rb-action ' : ''}${styles.statCard} ${onClick ? styles.statCardClickable : ''}`}
      style={{
        background: `linear-gradient(135deg, #FFFDF8 0%, ${accent}0A 100%)`,
      }}
    >
      {icon && <span className={styles.statIcon} aria-hidden>{icon}</span>}
      <div className={styles.statValue} style={{ color: accent }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </Tag>
  );
}

/* ─── Badge ─── */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'accent' | 'info';
  accent?: string;
}) {
  const tones: Record<string, { bg: string; fg: string; border: string }> = {
    neutral: { bg: TAN_LIGHT, fg: MUTED, border: TAN_BORDER },
    success: { bg: '#E6F4EA', fg: '#1F693D', border: '#2E7D4F' },
    warning: { bg: '#FBEAE3', fg: '#9C3B1A', border: '#B4602E' },
    accent: { bg: MARIGOLD_BG, fg: '#7D4C13', border: '#E8873A' },
    info: { bg: '#E8F0F8', fg: '#2C4E66', border: '#3D6B8A' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span className={styles.badge} style={{ background: t.bg, color: t.fg, borderColor: t.border }}>
      {children}
    </span>
  );
}

/* ─── Phil-IRI Tier Badge ─── */
const TIER_CONFIG: Record<PhilIRILevel, { label: string; className: string }> = {
  independent: { label: 'Independent', className: 'rb-tier rb-tier-independent' },
  instructional: { label: 'Instructional', className: 'rb-tier rb-tier-instructional' },
  frustration: { label: 'Needs Practice', className: 'rb-tier rb-tier-frustration' },
};

export function PhilIRIBadge({ level }: { level: PhilIRILevel; showIcon?: boolean }) {
  const cfg = TIER_CONFIG[level] || TIER_CONFIG.instructional;
  return <span className={cfg.className}>{cfg.label}</span>;
}

/* ─── Detail Panel ─── */
export function DetailPanel({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!open || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="rb-panel-overlay" onClick={onClose} />
      <div className="rb-detail-panel">
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: 'rgba(255,253,248,0.95)', backdropFilter: 'blur(8px)', borderBottom: `2px solid ${TAN_BORDER}` }}
        >
          <h2 className="text-lg" style={{ fontFamily: FONT_SERIF, fontWeight: 700, color: '#1F4D3A' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[#1F4D3A15] cursor-pointer"
            aria-label="Close panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </>,
    document.body
  );
}

/* ─── Progress Ring & Mini Bar ─── */
export function ProgressRing({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  color,
  label,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.round((value / max) * 100));
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} className="rb-progress-ring" aria-label={`${pct}%`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={TAN_BORDER} strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill={INK} style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 14 }} transform={`rotate(90 ${size / 2} ${size / 2})`}>
          {pct}%
        </text>
      </svg>
      {label && <span className="text-[11px] uppercase tracking-wide font-bold" style={{ fontFamily: FONT_SANS, color: MUTED, letterSpacing: '0.05em' }}>{label}</span>}
    </div>
  );
}

export function MiniProgressBar({ value, color, width = 80 }: { value: number; color: string; width?: number | string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  return (
    <div className="rb-mini-bar" style={{ width: widthStyle }}>
      <div className="rb-mini-bar-fill" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}

export function ScoreDisplay({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-12 text-right" style={{ fontFamily: FONT_MONO, fontWeight: 700, color }}>{Math.round(value)}%</span>
      <div className="flex-1"><MiniProgressBar value={value} color={color} width={120} /></div>
      <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>{label}</span>
    </div>
  );
}

/* ─── Avatar (Soft-Neobrutalism) ─── */
export function Avatar({ name, accent, size = 38 }: { name: string; accent: string; size?: number }) {
  const initials = (name || 'User').split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <span
      className="rb-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${accent}, ${accent}DD)`,
        borderColor: '#FFFFFF',
      }}
    >
      {initials}
    </span>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className={styles.emptyContainer}>
      <p className={styles.emptyText}>{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className={`rb-action ${styles.emptyButton}`}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ─── Error Boundary ─── */
interface ErrorProps { children: ReactNode; fallbackTitle?: string; }
interface ErrorState { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<ErrorProps, ErrorState> {
  public state: ErrorState = { hasError: false, error: null };
  public static getDerivedStateFromError(error: Error): ErrorState { return { hasError: true, error }; }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('[ErrorBoundary caught error]:', error, errorInfo); }
  public render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <h3 className={styles.errorTitle}>{this.props.fallbackTitle || 'Something went wrong'}</h3>
          <p className={styles.errorMessage}>{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className={`rb-action ${styles.errorRetryButton}`}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
