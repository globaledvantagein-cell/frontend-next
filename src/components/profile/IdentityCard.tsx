'use client';

import { Mail, User as UserIcon, Calendar } from 'lucide-react';
import { Badge } from '../ui';
import type { ProfileData } from './profileTypes';

interface Props {
  data: ProfileData;
  isAdmin: boolean;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function IdentityCard({ data, isAdmin }: Props) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {data.avatarUrl ? (
        <img
          src={data.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', flexShrink: 0,
          }}
        >
          <UserIcon size={26} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.name}
          </h2>
          {isAdmin && <Badge variant="red" style={{ fontSize: '0.6rem' }}>ADMIN</Badge>}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mail size={12} /> {data.email}
        </p>
        {data.createdAt && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} /> Joined {formatDate(data.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}