// Lightweight browser fingerprint for the anti-bypass signup gate.
//
// Combines: canvas hash, screen size, color depth, timezone, language,
// platform, hardware concurrency, user agent. Hashed via inline FNV-1a
// so we don't need a crypto dependency.
//
// This is NOT cryptographically strong identity — just enough to recognize
// the same browser/device after a cookie clear. Combined server-side with
// vid + IP for the composite identity check.

let cached: string | null = null;

function fnv1a(input: string): string {
  // FNV-1a 32-bit hash, hex-encoded. Stable, deterministic, fast.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-ctx';

    // Exact rendering output varies per GPU/font stack — that's the signal.
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('fingerprint-probe-🧪', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('fingerprint-probe-🧪', 4, 17);

    return fnv1a(canvas.toDataURL());
  } catch {
    return 'canvas-err';
  }
}

function gatherSignals(): string {
  const parts: (string | number)[] = [];

  parts.push(navigator.userAgent || '');
  parts.push(navigator.language || '');
  parts.push((navigator.languages || []).join(','));
  parts.push(navigator.platform || '');
  parts.push(navigator.hardwareConcurrency || 0);
  parts.push((navigator as any).deviceMemory || 0);

  parts.push(screen.width || 0);
  parts.push(screen.height || 0);
  parts.push(screen.colorDepth || 0);
  parts.push(screen.pixelDepth || 0);
  parts.push(window.devicePixelRatio || 1);

  try {
    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  } catch {
    parts.push('');
  }
  parts.push(new Date().getTimezoneOffset());

  parts.push(getCanvasHash());

  return parts.join('|');
}

export function getFingerprint(): string {
  if (cached) return cached;
  cached = fnv1a(gatherSignals());
  return cached;
}