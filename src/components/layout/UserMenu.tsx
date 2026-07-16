'use client';

/**
 * Signed-in user menu (desktop nav).
 *
 * Holds the links that don't earn a slot in the main nav — Profile, Applied —
 * plus Log out.
 *
 * Motion notes (per the design-engineering principles):
 *  - transform-origin: top right — the panel scales out of its trigger, not
 *    from its own centre. A popover that grows from the middle reads as
 *    unanchored.
 *  - Enters from scale(0.96), never scale(0). Nothing in the real world
 *    appears out of nothing.
 *  - 150ms with a strong ease-out curve: the user sees movement immediately,
 *    which is the moment they're watching most closely. Well under the 300ms
 *    ceiling for UI.
 *  - CSS transitions, not keyframes, so rapid open/close retargets smoothly
 *    from the current position instead of restarting.
 *  - Exit is faster than enter (110ms): the user has already decided.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from '@/compat/router';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { Badge } from '../ui';
import { USER_MENU_LINKS } from './navLinks';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

interface Props {
  userName?: string;
  isAdmin: boolean;
  onLogout: () => void;
}

const itemStyle: CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  fontSize: '0.84rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  borderRadius: 6,
  transition: `background-color 120ms ${EASE_OUT}, color 120ms ${EASE_OUT}`,
};

export default function UserMenu({ userName, isAdmin, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [render, setRender] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Keep the node mounted through the exit transition, then unmount.
  useEffect(() => {
    if (open) { setRender(true); return; }
    const t = setTimeout(() => setRender(false), 110);
    return () => clearTimeout(t);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // Click-outside + Escape. Both are what users reach for to dismiss.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)';
    e.currentTarget.style.color = 'var(--text-primary)';
  };
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = 'var(--text-secondary)';
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="no-touch-expand"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
          color: 'var(--text-muted)', background: 'none',
          border: '1px solid transparent', borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer',
          // Only transform — never `all`. 120ms keeps the press feeling instant.
          transition: `transform 120ms ${EASE_OUT}`,
        }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <UserIcon size={13} /> {userName}
        {isAdmin && <Badge variant="red" style={{ fontSize: '0.58rem', padding: '2px 6px' }}>ADMIN</Badge>}
        <ChevronDown
          size={12}
          style={{ transition: `transform 150ms ${EASE_OUT}`, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {render && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            minWidth: 170, padding: 6,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
            zIndex: 60,
            // Scales out of the trigger (top-right), not its own centre.
            transformOrigin: 'top right',
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1)' : 'scale(0.96)',
            transition: open
              ? `opacity 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}`
              : `opacity 110ms ${EASE_OUT}, transform 110ms ${EASE_OUT}`,
          }}
        >
          {USER_MENU_LINKS.map(([path, label]) => (
            <Link
              key={path}
              to={path}
              role="menuitem"
              onClick={close}
              style={itemStyle}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              {label}
            </Link>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />

          <button
            role="menuitem"
            onClick={() => { close(); onLogout(); }}
            style={{
              ...itemStyle,
              width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            <LogOut size={13} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}