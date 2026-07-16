import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from '@/utils/categorize';
import { fetchJobs, SITE_URL } from '@/lib/serverApi';
import SeoJobCard from '@/components/seo/SeoJobCard';
import JsonLd, { itemListJsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string }> };

function isCategory(slug: string): slug is Category {
  return (CATEGORY_ORDER as readonly string[]).includes(slug);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category: slug } = await params;
  if (!isCategory(slug)) return { title: 'Category not found' };
  const label = CATEGORY_LABELS[slug];
  const { totalJobs } = await fetchJobs({ category: slug, limit: 1 });
  const title = `English ${label} Jobs in Germany — No German Required`;
  const description = `Browse ${totalJobs} English-speaking ${label} ${
    totalJobs === 1 ? 'role' : 'roles'
  } across Germany. No German language required — every role is checked before it is listed.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: { title, description, url: `${SITE_URL}/category/${slug}`, type: 'website' },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { category: slug } = await params;
  if (!isCategory(slug)) notFound();
  const label = CATEGORY_LABELS[slug];

  const { jobs, totalJobs } = await fetchJobs({ category: slug, limit: 100 });
  const otherCategories = CATEGORY_ORDER.filter((c) => c !== slug);

  const title = `English ${label} Jobs in Germany`;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px)' }}>
      <JsonLd data={itemListJsonLd(title, jobs, SITE_URL)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Jobs', url: `${SITE_URL}/jobs` },
          { name: label, url: `${SITE_URL}/category/${slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        <Link href="/" style={{ color: 'inherit' }}>Home</Link>
        {' › '}
        <Link href="/jobs" style={{ color: 'inherit' }}>Jobs</Link>
        {' › '}
        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
      </nav>

      <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
        English {label} Jobs in Germany
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '1rem', maxWidth: 640 }}>
        {totalJobs} English-speaking {label} {totalJobs === 1 ? 'role' : 'roles'} across Germany.
        No German required — every role is checked before it is listed.
      </p>

      <div style={{ margin: '24px 0' }}>
        <Link
          href={`/jobs?category=${encodeURIComponent(slug)}`}
          style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
        >
          Browse all {label} jobs →
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          No open {label} roles right now. Browse{' '}
          <Link href="/jobs" style={{ color: 'var(--primary)' }}>all jobs</Link>.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {jobs.map((job) => (
            <SeoJobCard key={job._id} job={job} />
          ))}
        </div>
      )}

      <section style={{ marginTop: 48, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          Other job categories
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {otherCategories.map((c) => (
            <Link
              key={c}
              href={`/category/${c}`}
              style={{
                fontSize: '0.85rem',
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
