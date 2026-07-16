'use client';

import { forwardRef } from 'react';
import type { CSSProperties, InputHTMLAttributes } from 'react';

const INPUT_STYLE: CSSProperties = {
  width: '100%', padding: '12px 14px',
  fontFamily: 'inherit', fontSize: '0.925rem',
  background: 'var(--surface-solid)',
  color: 'var(--ink)',
  border: '1.25px solid var(--ink-border, var(--border))',
  borderRadius: '10px', outline: 'none',
  transition: 'border-color 0.22s, box-shadow 0.22s',
};

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, className = '', ...rest }, ref) => {
    return (
      <div style={{ width: '100%' }}>
        <input
          ref={ref}
          className={`sketch-ink ${className}`}
          style={{ ...INPUT_STYLE, ...(error ? { borderColor: 'var(--danger)' } : {}), ...style }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--ink-border, var(--border))'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
          {...rest}
        />
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
      </div>
    );
  }
);