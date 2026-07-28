'use client';

/**
 * /health (admin) — live system status dashboard.
 *
 * Modeled on public status pages (Stripe/GitHub style): an overall banner,
 * checks grouped by area, a colored history strip per check (last 40 pings,
 * kept client-side), latency readouts, and an auto-refresh countdown.
 *
 * Pings GET /api/admin/health every 60s. Pauses while the tab is hidden
 * (no wasted pings), resumes + pings immediately on focus. Backend pings
 * carry x-health-check so they never create visitors or touch analytics.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Container, PageHeader } from '../components/ui';
import { apiGet } from '../utils/jobApi';

const PING_INTERVAL_S = 60;
const HISTORY_LEN = 40;

type CheckStatus = 'ok' | 'warn' | 'fail';
interface HealthCheck {
  key: string; label: string; group: string; critical: boolean;
  status: CheckStatus; latencyMs: number; detail: string;
}
interface HealthResponse {
  overall: 'operational' | 'degraded' | 'down';
  timestamp: string;
  checks: HealthCheck[];
}

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok: 'var(--success, #22c55e)',
  warn: 'var(--warning, #f59e0b)',
  fail: 'var(--danger, #ef4444)',
};

const OVERALL_META = {
  operational: { color: 'var(--success, #22c55e)', label: 'All systems operational', Icon: CheckCircle2 },
  degraded: { color: 'var(--warning, #f59e0b)', label: 'Partially degraded', Icon: AlertTriangle },
  down: { color: 'var(--danger, #ef4444)', label: 'Major outage', Icon: XCircle },
  unreachable: { color: 'var(--danger, #ef4444)', label: 'API unreachable', Icon: XCircle },
} as const;

export default function SystemHealth() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(PING_INTERVAL_S);
  // Per-check status history, client-side only (clears on page reload).
  const historyRef = useRef<Map<string, CheckStatus[]>>(new Map());
  const [, forceRender] = useState(0);

  const ping = useCallback(async () => {
    try {
      const res = await apiGet<HealthResponse>('/api/admin/health');
      setData(res);
      setUnreachable(false);
      for (const c of res.checks) {
        const h = historyRef.current.get(c.key) || [];
        h.push(c.status);
        if (h.length > HISTORY_LEN) h.shift();
        historyRef.current.set(c.key, h);
      }
      forceRender(n => n + 1);
    } catch {
      // The health endpoint itself failing IS the signal: everything down.
      setUnreachable(true);
    } finally {
      setLoading(false);
      setCountdown(PING_INTERVAL_S);
    }
  }, []);

  // Auto-ping loop with hidden-tab pause.
  useEffect(() => {
    ping();
    const tick = setInterval(() => {
      if (document.hidden) return; // paused in background
      setCountdown(c => {
        if (c <= 1) { ping(); return PING_INTERVAL_S; }
        return c - 1;
      });
    }, 1000);
    const onVisible = () => { if (!document.hidden) ping(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVisible); };
  }, [ping]);

  const overallKey = unreachable ? 'unreachable' : (data?.overall ?? 'operational');
  const overall = OVERALL_META[overallKey as keyof typeof OVERALL_META];

  const groups = new Map<string, HealthCheck[]>();
  for (const c of data?.checks ?? []) {
    const arr = groups.get(c.group) || [];
    arr.push(c);
    groups.set(c.group, arr);
  }

  return (
    <Container>
      <PageHeader
        label="Admin"
        title="System Health"
        subtitle="Live checks across every service — auto-refreshes without touching visitor analytics."
      />

      {/* Overall banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        border: `1px solid ${overall.color}40`,
        background: `${overallKey === 'operational' ? 'var(--success-soft, rgba(34,197,94,0.08))' : `${overall.color}14`}`,
        borderRadius: 14, padding: '16px 20px', marginBottom: 24,
      }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 12, height: 12 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: overall.color, opacity: 0.4, animation: loading ? undefined : 'ejg-ping 2s ease-out infinite' }} />
          <span style={{ position: 'relative', width: 12, height: 12, borderRadius: '50%', background: overall.color }} />
        </span>
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {loading ? 'Checking…' : overall.label}
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {data && !unreachable && <span>Last check {new Date(data.timestamp).toLocaleTimeString()}</span>}
          <span>Next in {countdown}s</span>
          <button
            type="button"
            onClick={() => { setLoading(true); ping(); }}
            title="Refresh now"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} style={loading ? { animation: 'ejg-spin 1s linear infinite' } : undefined} /> Refresh
          </button>
        </span>
      </div>

      {unreachable && (
        <p style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 20 }}>
          The health endpoint didn&apos;t respond — the API server may be down, or your session expired. Retrying automatically.
        </p>
      )}

      {/* Grouped checks */}
      {[...groups.entries()].map(([group, checks]) => (
        <section key={group} style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            {group}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {checks.map(c => {
              const history = historyRef.current.get(c.key) || [];
              return (
                <div key={c.key} style={{
                  border: '1px solid var(--border)', borderRadius: 12,
                  background: 'var(--bg-surface)', padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[c.status], flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.label}</span>
                    {c.critical && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase' }}>
                        critical
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {c.latencyMs}ms
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: c.status === 'ok' ? 'var(--text-secondary)' : STATUS_COLOR[c.status] }}>
                    {c.detail || '—'}
                  </div>
                  {/* History strip — one bar per ping, newest right. */}
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }} title={`Last ${history.length} checks this session`}>
                    {Array.from({ length: HISTORY_LEN }).map((_, i) => {
                      const s = history[history.length - HISTORY_LEN + i];
                      return (
                        <span key={i} style={{
                          flex: 1, borderRadius: 1,
                          height: s ? 14 : 6,
                          background: s ? STATUS_COLOR[s] : 'var(--bg-surface-2)',
                          opacity: s ? 0.9 : 1,
                        }} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8 }}>
        Health pings carry the <code>x-health-check</code> header — they are excluded from visitor creation and page-view analytics.
      </p>

      <style>{`
        @keyframes ejg-ping { 0% { transform: scale(1); opacity: 0.4; } 80%, 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes ejg-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          [style*="ejg-ping"], [style*="ejg-spin"] { animation: none !important; }
        }
      `}</style>
    </Container>
  );
}
