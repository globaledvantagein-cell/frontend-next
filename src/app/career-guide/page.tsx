import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchPublishedArticles, SITE_URL } from '@/lib/serverApi';
import { CAREER_GUIDE_CATEGORIES, careerCategoryLabel } from '@/data/careerGuide';
import JsonLd, { breadcrumbJsonLd } from '@/components/seo/JsonLd';

// ISR: articles change rarely, so cache the page and revalidate hourly. The
// article fetch passes the same `revalidate` (a `no-store` fetch would force
// this route dynamic and defeat the cache).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Germany Career Guide — Working in Germany Without German',
  description:
    'Practical guides on finding English-speaking jobs in Germany: visas, salaries, companies, and settling in. Written for internationals.',
  alternates: { canonical: '/career-guide' },
};

export default async function CareerGuideHub() {
  const articles = await fetchPublishedArticles(3600);
  const counts = new Map<string, number>();
  for (const a of articles) counts.set(a.category, (counts.get(a.category) || 0) + 1);
  const latest = [...articles]
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .slice(0, 6);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px)' }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Career Guide', url: `${SITE_URL}/career-guide` },
        ])}
      />

      <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
        Germany Career Guide
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '1rem', maxWidth: 640 }}>
        Practical guides on finding English-speaking jobs in Germany — visas, salaries, companies, and settling in.
      </p>

      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '32px 0 14px' }}>
        Categories
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {CAREER_GUIDE_CATEGORIES.map((slug) => (
          <Link
            key={slug}
            href={`/career-guide/${slug}`}
            style={{
              display: 'block',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{careerCategoryLabel(slug)}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {counts.get(slug) || 0} {(counts.get(slug) || 0) === 1 ? 'guide' : 'guides'}
            </span>
          </Link>
        ))}
      </div>

      {latest.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            Latest articles
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {latest.map((a) => (
              <li key={a._id}>
                <Link
                  href={`/career-guide/${a.category}/${a.slug}`}
                  style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  {a.title}
                </Link>
                <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {careerCategoryLabel(a.category)}
                  {a.description ? ` — ${a.description}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
