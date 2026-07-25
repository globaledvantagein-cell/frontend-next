'use client';

/**
 * /premium — Premium checkout.
 *
 * IMPORTANT — the card form is a FAKE payment gateway. The card number, expiry,
 * CVV and cardholder name are UI-only: they feed local state purely for input
 * masking and are NEVER sent to any server, written to storage, or logged. The
 * only real payment path during beta is a 100%-off promo code, redeemed via the
 * Confirm button (POST /api/auth/redeem-promo).
 *
 * Note on reuse: the spec suggested importing UpgradeModal's PromoCodeForm, but
 * that component redeems-and-reloads on Apply, which is incompatible with the
 * "apply → order summary updates → Confirm button redeems → redirect to /jobs"
 * flow this page (and its tests) require. There is no frontend validate-only
 * endpoint (backend is unchanged), so the promo Apply here is optimistic and the
 * single real redemption happens on Confirm.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from '@/compat/router';
import { Crown, Check, Shield, Lock, CreditCard, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { redeemPromoCode, ApiError } from '../utils/jobApi';
import { Spinner } from '../components/ui';
import { useMediaQuery } from '../hooks/useMediaQuery';

const PLAN_PRICE = '€14.99';
const PLAN_ZERO = '€0.00';

const FEATURES: string[] = [
  'Unlimited job description views',
  'Unlimited apply clicks',
  'Smart Match — AI resume scoring',
  "Today's Matches — daily personalized picks",
  'Advanced filters — salary, visa, relocation, experience, workplace',
  'Salary insights — extracted amounts with confidence tier',
  'Priority support',
];

// ── Input masking (pure, display-only) ───────────────────────────────────────
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
function formatCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PremiumCheckout() {
  const nav = useNavigate();
  const { isAuthenticated, isLoading, isPremium, usage, refreshUsage } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Card fields — UI-only, never transmitted.
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardFocused, setCardFocused] = useState(false);

  // Promo + confirmation.
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Mobile: features collapsed by default.
  const [showFeatures, setShowFeatures] = useState(false);

  // Auth gate — bounce anonymous users to login (preserving intent).
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      nav('/login?redirect=/premium', { replace: true });
    }
  }, [isLoading, isAuthenticated, nav]);

  const applyPromo = () => {
    if (!promoCode.trim()) return;
    setPromoApplied(true);
    setConfirmError(null);
  };

  const handleConfirm = async () => {
    if (!promoApplied || !promoCode.trim() || confirming || confirmed) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await redeemPromoCode(promoCode.trim());
      await refreshUsage();
      setConfirmed(true);
      setTimeout(() => nav('/jobs'), 2000);
    } catch (err) {
      const body = err instanceof ApiError ? err.body : null;
      setConfirmError(body?.message || (err instanceof Error ? err.message : 'Payment could not be completed.'));
      setConfirming(false);
    }
  };

  // ── Loading / redirect states ───────────────────────────────────────────
  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Spinner size={20} />
      </div>
    );
  }

  // ── Already premium ─────────────────────────────────────────────────────
  // `!confirmed` so that a just-completed redemption (which flips isPremium via
  // refreshUsage) keeps showing the "Premium activated!" success state on the
  // checkout button until the 2s redirect, rather than snapping to this card.
  if (isPremium && !confirmed) {
    const premiumExpiry = formatDate(usage?.premiumExpiresAt);
    return (
      <div style={{ minHeight: '80vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          maxWidth: 420, width: '100%', textAlign: 'center',
          background: 'var(--surface-solid)', border: '1.25px solid var(--border)',
          borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--acid-soft)', color: 'var(--acid)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={26} />
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
            You&apos;re already on Premium
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {premiumExpiry ? `Active until ${premiumExpiry}.` : 'You have full access to every Premium feature.'}
          </p>
          <button
            type="button"
            onClick={() => nav('/jobs')}
            style={{ marginTop: 4, height: 44, padding: '0 22px', background: 'var(--acid)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
          >
            Back to jobs
          </button>
        </div>
      </div>
    );
  }

  // ── Shared pieces ───────────────────────────────────────────────────────
  const planSummary = (
    <div style={{
      background: 'var(--surface-solid)', border: '1.25px solid var(--border)',
      borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-md)',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        background: 'var(--acid-soft)', color: 'var(--acid)', padding: '4px 10px', borderRadius: 999,
      }}>
        <Crown size={13} /> Premium
      </span>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
        <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{PLAN_PRICE}</span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ 3 months</span>
      </div>
      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>~€5.00/month</p>

      <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

      {/* Features — collapsible on mobile. */}
      {(!isMobile || showFeatures) && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {FEATURES.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <span style={{ color: 'var(--acid)', flexShrink: 0, marginTop: 1 }}><Check size={15} /></span>
              {f}
            </li>
          ))}
        </ul>
      )}
      {isMobile && (
        <button
          type="button"
          onClick={() => setShowFeatures(s => !s)}
          style={{ marginTop: showFeatures ? 14 : 0, background: 'none', border: 'none', color: 'var(--acid)', fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          {showFeatures ? 'Hide features' : 'See features'}
        </button>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} style={{ color: 'var(--acid)', flexShrink: 0 }} /> 30-day money-back guarantee
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> Cancel anytime
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> Secure checkout
        </span>
      </div>
    </div>
  );

  const cardInputBase: CSSProperties = {
    height: 44, fontSize: 15, border: 'none', outline: 'none',
    background: 'transparent', color: 'var(--text-primary)', fontFamily: 'inherit',
    padding: '0 12px', width: '100%',
  };
  const standaloneInput: CSSProperties = {
    height: 44, fontSize: 15, borderRadius: 8, padding: '0 12px', width: '100%',
    border: '1px solid var(--border)', background: 'var(--bg-surface, var(--surface-solid))',
    color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
  };
  const focusOn = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--acid)'; };
  const focusOff = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--border)'; };

  const paymentForm = (
    <div>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Payment method</h2>

      {/* Connected card group (Stripe-style) — card number on top, expiry + CVV below. */}
      <div style={{ border: `1px solid ${cardFocused ? 'var(--acid)' : 'var(--border)'}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s', background: 'var(--bg-surface, var(--surface-solid))' }}>
        <div style={{ position: 'relative', borderBottom: '1px solid var(--border)' }}>
          <CreditCard size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" inputMode="numeric" autoComplete="off"
            placeholder="1234 5678 9012 3456" maxLength={19}
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            onFocus={() => setCardFocused(true)} onBlur={() => setCardFocused(false)}
            aria-label="Card number"
            style={{ ...cardInputBase, paddingLeft: 38 }}
          />
        </div>
        <div style={{ display: 'flex' }}>
          <input
            type="text" inputMode="numeric" autoComplete="off"
            placeholder="MM/YY" maxLength={5}
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            onFocus={() => setCardFocused(true)} onBlur={() => setCardFocused(false)}
            aria-label="Expiry date"
            style={{ ...cardInputBase, borderRight: '1px solid var(--border)' }}
          />
          <div style={{ position: 'relative', flex: 1 }}>
            <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text" inputMode="numeric" autoComplete="off"
              placeholder="CVV" maxLength={4}
              value={cvv}
              onChange={e => setCvv(formatCvv(e.target.value))}
              onFocus={() => setCardFocused(true)} onBlur={() => setCardFocused(false)}
              aria-label="CVV"
              style={{ ...cardInputBase, paddingLeft: 34 }}
            />
          </div>
        </div>
      </div>

      <input
        type="text" autoComplete="off"
        placeholder="Name on card"
        value={cardName}
        onChange={e => setCardName(e.target.value)}
        onFocus={focusOn} onBlur={focusOff}
        aria-label="Cardholder name"
        style={{ ...standaloneInput, marginTop: 10 }}
      />

      {/* Adjacent trust cue — research: place security next to the card, not only in the footer. */}
      <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        <Lock size={12} /> Your card details are encrypted and never stored.
      </p>

      {/* "or" divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Promo — the real payment path during beta. */}
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>Have a promo code?</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text" autoComplete="off"
          placeholder="Promo code" maxLength={40}
          value={promoCode}
          onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false); setConfirmError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') applyPromo(); }}
          onFocus={focusOn} onBlur={focusOff}
          aria-label="Promo code"
          style={{ ...standaloneInput, flex: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}
        />
        <button
          type="button"
          onClick={applyPromo}
          disabled={!promoCode.trim() || promoApplied}
          style={{
            height: 44, padding: '0 18px', flexShrink: 0, borderRadius: 8,
            background: promoApplied ? 'var(--success-soft)' : 'var(--acid)',
            color: promoApplied ? 'var(--success)' : '#fff',
            border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
            cursor: !promoCode.trim() || promoApplied ? 'default' : 'pointer',
            opacity: !promoCode.trim() ? 0.6 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {promoApplied ? (<><Check size={15} /> Applied</>) : 'Apply'}
        </button>
      </div>

      {/* Order summary */}
      <div style={{ marginTop: 20, border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--bg-surface-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <span>Premium — 3 months</span>
          {promoApplied ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{PLAN_PRICE}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{PLAN_ZERO}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em', background: 'var(--success-soft)', color: 'var(--success)', padding: '2px 6px', borderRadius: 4 }}>PROMO APPLIED</span>
            </span>
          ) : (
            <span style={{ color: 'var(--text-primary)' }}>{PLAN_PRICE}</span>
          )}
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>Due today</span>
          <span>{promoApplied ? PLAN_ZERO : PLAN_PRICE}</span>
        </div>
      </div>
    </div>
  );

  const confirmButton = (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={!promoApplied || confirming || confirmed}
      title={!promoApplied ? 'Enter a promo code during beta' : undefined}
      style={{
        width: '100%', height: 48, borderRadius: 10, border: 'none',
        background: confirmed ? 'var(--success)' : 'var(--acid)', color: '#fff',
        fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
        cursor: !promoApplied || confirming || confirmed ? 'not-allowed' : 'pointer',
        opacity: !promoApplied ? 0.55 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background 0.2s, opacity 0.2s',
      }}
    >
      {confirmed ? (<><Check size={18} /> Premium activated!</>)
        : confirming ? (<><Spinner size={16} /> Processing…</>)
        : (<>Confirm payment · {promoApplied ? PLAN_ZERO : PLAN_PRICE}</>)}
    </button>
  );

  const confirmErrorEl = confirmError ? (
    <p style={{ margin: '10px 0 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--danger)', textAlign: 'center' }}>{confirmError}</p>
  ) : null;

  const trustFooter = (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 16 }}>
      {[
        { icon: <Lock size={13} />, text: 'Secure checkout' },
        { icon: <RefreshCw size={13} />, text: 'Cancel anytime' },
        { icon: <Check size={13} />, text: 'No surprise charges' },
      ].map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
          {t.icon} {t.text}
        </span>
      ))}
    </div>
  );

  // ── Layout ──────────────────────────────────────────────────────────────
  const rightColumn = (
    <div style={{
      background: 'var(--surface-solid)', border: '1.25px solid var(--border)',
      borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: 'var(--shadow-md)',
    }}>
      {paymentForm}
      {!isMobile && (
        <div style={{ marginTop: 20 }}>
          {confirmButton}
          {confirmErrorEl}
          {trustFooter}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ background: 'var(--paper)', minHeight: '90vh', padding: isMobile ? '20px 16px 0' : '32px 24px 48px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Upgrade to Premium
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '0 0 24px' }}>
          Unlock unlimited access to every English-speaking role in Germany.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.15fr', gap: isMobile ? 16 : 28, alignItems: 'start' }}>
          {planSummary}
          {rightColumn}
        </div>

        {/* Mobile: sticky confirm bar with a fade so content reads under it. */}
        {isMobile && (
          <div style={{
            position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 20,
            margin: '16px -16px 0', padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            background: 'linear-gradient(to top, var(--paper) 55%, transparent)',
          }}>
            {confirmErrorEl}
            {confirmButton}
            {trustFooter}
          </div>
        )}
      </div>
    </div>
  );
}
