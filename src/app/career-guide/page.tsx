import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchPublishedArticles, SITE_URL } from '@/lib/serverApi';
import { CAREER_GUIDE_CATEGORIES, careerCategoryLabel } from '@/data/careerGuide';
import { estimateReadingMinutes } from '@/lib/markdown';
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

function formatDate(value?: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function CareerGuideHub() {
  const articles = await fetchPublishedArticles(3600);
  const counts = new Map<string, number>();
  for (const a of articles) counts.set(a.category, (counts.get(a.category) || 0) + 1);
  const latest = [...articles]
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .slice(0, 6);

  return (
    <div className="guide-hub">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Career Guide', url: `${SITE_URL}/career-guide` },
        ])}
      />

      <header className="guide-hero">
        <span className="guide-hero__eyebrow">Career Guide</span>
        <h1 className="guide-hero__title">Working in Germany, in English</h1>
        <p className="guide-hero__lede">
          Practical, no-nonsense guides on landing an English-speaking job in Germany — visas,
          salaries, companies, and everything about settling in. Written for internationals.
        </p>
      </header>

      <section aria-labelledby="cats-heading">
        <h2 id="cats-heading" className="guide-section-title">Browse by topic</h2>
        <div className="guide-cat-grid">
          {CAREER_GUIDE_CATEGORIES.map((slug) => {
            const n = counts.get(slug) || 0;
            return (
              <Link key={slug} href={`/career-guide/${slug}`} className="guide-cat">
                <span className="guide-cat__name">{careerCategoryLabel(slug)}</span>
                <span className="guide-cat__count">{n} {n === 1 ? 'guide' : 'guides'}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {latest.length > 0 && (
        <section aria-labelledby="latest-heading" className="guide-latest">
          <h2 id="latest-heading" className="guide-section-title">Latest articles</h2>
          <div className="guide-article-grid">
            {latest.map((a) => (
              <Link key={a._id} href={`/career-guide/${a.category}/${a.slug}`} className="article-card">
                <span className="article-card__badge">{careerCategoryLabel(a.category)}</span>
                <span className="article-card__title">{a.title}</span>
                {a.description && <span className="article-card__desc">{a.description}</span>}
                <span className="guide-article-card__meta">
                  {a.publishedAt && <>{formatDate(a.publishedAt)}<span aria-hidden="true"> · </span></>}
                  {estimateReadingMinutes(a.content)} min read
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
