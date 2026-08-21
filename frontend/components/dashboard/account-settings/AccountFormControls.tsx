'use client';

import { ReactNode } from 'react';
import { TAN_BORDER } from '../_shared';
import styles from './account-settings.module.css';

export function SettingFieldRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className={styles.fieldRow}>
      <div className="pt-1">
        <span className={styles.fieldLabel}>{label}</span>
        {hint && <p className={styles.fieldHint}>{hint}</p>}
      </div>
      <div className={styles.fieldControls}>{children}</div>
    </div>
  );
}

export function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className="rb-input w-full"
      style={disabled ? { opacity: 0.65, cursor: 'not-allowed', background: '#F5F0E6' } : undefined}
    />
  );
}

export function SuccessToast({ message }: { message: string }) {
  return (
    <span className={`${styles.toast} rb-fade-in-up`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D4F" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </span>
  );
}

export function ToggleSwitch({ checked, onChange, accent }: { checked: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={styles.toggleSwitch}
      style={{
        background: checked ? `linear-gradient(135deg, ${accent}, ${accent}DD)` : TAN_BORDER,
        boxShadow: checked ? `0 0 10px ${accent}33` : 'none',
      }}
    >
      <span className={styles.toggleKnob} style={{ left: checked ? '22px' : '2px' }}>
        {checked ? '✓' : ''}
      </span>
    </button>
  );
}
