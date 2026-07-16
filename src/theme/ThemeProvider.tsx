'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { lightVars, darkVars } from './themes';

type Mode = 'light' | 'dark';

interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
  isDark: boolean;
  /** False during SSR and the first client render; true after mount. Use it to
   *  avoid rendering theme-dependent output before hydration completes. */
  mounted: boolean;
}

const Ctx = createContext<ThemeCtx>({ mode: 'light', toggle: () => { }, isDark: false, mounted: false });

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to 'light' on the server (no localStorage/matchMedia there); the
  // effect below reconciles to the real preference after mount.
  const [mode, setMode] = useState<Mode>('light');
  const [mounted, setMounted] = useState(false);

  // Read the persisted / system preference once, client-side only.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('ej-theme') as Mode | null;
    if (saved) setMode(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    applyVars(mode === 'dark' ? darkVars : lightVars);
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('ej-theme', mode);
  }, [mode]);

  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark');

  return (
    <Ctx.Provider value={{ mode, toggle, isDark: mode === 'dark', mounted }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);