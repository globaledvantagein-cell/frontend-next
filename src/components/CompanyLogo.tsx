'use client';

// Company logo via the Google Favicon API — a single keyless, rate-limit-free
// source. Two states only: the image, or the letter avatar on error.

import { useEffect, useState } from 'react';
import { companyLogoUrl } from '../utils/companyLogo';

export default function CompanyLogo({ companyName, domain, size = 40 }: {
  companyName: string;
  domain?: string;
  size?: number;
}) {
  const [imgErr, setImgErr] = useState(false);

  // A recycled component instance (list re-render with a different job) must
  // retry the image for the new company.
  useEffect(() => { setImgErr(false); }, [companyName, domain]);

  const url = companyLogoUrl({ companyName, domain });

  if (url && !imgErr) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{
          width: size, height: size, objectFit: 'contain', flexShrink: 0,
          // Consistent frame: logos with baked-in white padding (e.g. Asana)
          // otherwise read as floating white boxes on the cream background.
          borderRadius: 6, background: 'var(--bg-surface)',
          border: '1px solid var(--border)', padding: 2,
        }}
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
