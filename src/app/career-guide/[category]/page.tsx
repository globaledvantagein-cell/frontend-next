import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchArticlesByCategory, SITE_URL } from '@/lib/serverApi';
import { CAREER_GUIDE_CATEGORIES, careerCategoryLabel } from '@/data/careerGuide';
import JsonLd, { breadcrumbJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  if (!CAREER_GUIDE_CATEGORIES.includes(category)) return { title: 'Not found' };
  const label = careerCategoryLabel(category);
  const articles = await fetchArticlesByCategory(category);
  const title = `${label} — Germany Career Guide`;
  const description = `${articles.length} ${
    articles.length === 1 ? 'guide' : 'guides'
  } on ${label.toLowerCase()} for English speakers in Germany.`;
  return { title, description, alternates: { canonical: `/career-guide/${category}` } };
}

export default async function CareerGuideCategory({ params }: Params) {
  const { category } = await params;
  if (!CAREER_GUIDE_CATEGORIES.includes(category)) notFound();
  const label = careerCategoryLabel(category);
  const articles = await fetchArticlesByCategory(category);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px)' }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Career Guide', url: `${SITE_URL}/career-guide` },
          { name: label, url: `${SITE_URL}/career-guide/${category}` },
        ])}
      />

      <nav aria-label="Breadcrumb" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        <Link href="/" style={{ color: 'inherit' }}>Home</Link>
        {' › '}
        <Link href="/career-guide" style={{ color: 'inherit' }}>Career Guide</Link>
        {' › '}
        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
      </nav>

      <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
        {label}
      </h1>

      {articles.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>
          No guides in this category yet. Back to the{' '}
          <Link href="/career-guide" style={{ color: 'var(--primary)' }}>career guide</Link>.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {articles.map((a) => (
            <li key={a._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <Link
                href={`/career-guide/${category}/${a.slug}`}
                style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none' }}
              >
                {a.title}
              </Link>
              {a.description && (
                <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0', fontSize: '0.9rem' }}>{a.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
