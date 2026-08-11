'use client';

// 40px company logo via Unavatar, gracefully falling back to a letter avatar
// (first initial in a colored circle) when the image fails to load.

import { useState } from 'react';
import { companyLogoUrl } from '../utils/companyLogo';

export default function CompanyLogo({ companyName, domain, size = 40 }: {
  companyName: string;
  domain?: string;
  size?: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  const url = companyLogoUrl({ companyName, domain });

  if (url && !imgErr) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }}
        onError={() => setImgErr(true)}
        loading="lazy"
      />
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--primary-soft)', color: 'var(--primary)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 700,
    }}>
      {companyName.charAt(0).toUpperCase()}
    </span>
  );
}
