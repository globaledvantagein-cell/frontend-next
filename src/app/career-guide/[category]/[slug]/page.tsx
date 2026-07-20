import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { fetchArticleBySlug, fetchArticlesByCategory, SITE_URL } from '@/lib/serverApi';
import { careerCategoryLabel } from '@/data/careerGuide';
import { renderArticle } from '@/lib/markdown';
import JsonLd, { breadcrumbJsonLd } from '@/components/seo/JsonLd';
import ReadingProgress from '@/components/ReadingProgress';
import TableOfContents from '@/components/TableOfContents';
import ArticleShare from '@/components/ArticleShare';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string; slug: string }> };

function formatDate(value?: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);
  if (!article) return { title: 'Article not found' };
  const title = `${article.title} — Germany Career Guide`;
  const description =
    article.description ||
    `${article.title} — a practical guide for English speakers working in Germany.`;
  return {
    title,
    description,
    alternates: { canonical: `/career-guide/${article.category}/${slug}` },
    openGraph: { title, description, type: 'article' },
  };
}

export default async function CareerGuideArticle({ params }: Params) {
  const { category, slug } = await params;
  const article = await fetchArticleBySlug(slug);
  if (!article) notFound();
  // Canonicalise category, matching the backend's 301 behaviour.
  if (article.category !== category) redirect(`/career-guide/${article.category}/${slug}`);

  const label = careerCategoryLabel(article.category);
  const { html, headings, readingMinutes } = renderArticle(article.content);
  const pageUrl = `${SITE_URL}/career-guide/${article.category}/${slug}`;

  const related = (await fetchArticlesByCategory(article.category))
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <>
      <ReadingProgress />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Career Guide', url: `${SITE_URL}/career-guide` },
          { name: label, url: `${SITE_URL}/career-guide/${article.category}` },
          { name: article.title, url: pageUrl },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.description || undefined,
          author: { '@type': 'Organization', name: article.author || 'English Jobs Germany' },
          publisher: {
            '@type': 'Organization',
            name: 'English Jobs Germany',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.jpeg` },
          },
          datePublished: article.publishedAt || undefined,
          dateModified: article.updatedAt || article.publishedAt || undefined,
          mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        }}
      />

      <div className="article-shell">
        <aside className="article-rail">
          <TableOfContents headings={headings} />
        </aside>

        <article className="article-main">
          <nav aria-label="Breadcrumb" className="article-crumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/career-guide">Career Guide</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/career-guide/${article.category}`}>{label}</Link>
          </nav>

          <header className="article-head">
            <Link href={`/career-guide/${article.category}`} className="article-eyebrow">{label}</Link>
            <h1 className="article-title">{article.title}</h1>
            <p className="article-meta">
              {article.publishedAt && <><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time><span aria-hidden="true"> · </span></>}
              <span>{readingMinutes} min read</span>
              <span aria-hidden="true"> · </span>
              <span>By {article.author || 'English Jobs Germany'}</span>
            </p>
          </header>

          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <ArticleShare url={pageUrl} title={article.title} />

          <section className="article-cta" aria-labelledby="cta-heading">
            <h2 id="cta-heading" className="article-cta__title">
              Looking for English-speaking jobs in Germany?
            </h2>
            <p className="article-cta__body">
              Browse 2,000+ verified roles — no German required. Every listing is checked before it goes live.
            </p>
            <div className="article-cta__actions">
              <Link href="/jobs" className="article-btn article-btn--primary">Browse Jobs</Link>
              <Link href="/signup" className="article-btn article-btn--ghost">Create Free Account</Link>
            </div>
          </section>

          {related.length > 0 && (
            <section className="article-related" aria-labelledby="related-heading">
              <h2 id="related-heading" className="article-related__title">More from {label}</h2>
              <div className="article-related__grid">
                {related.map((a) => (
                  <Link
                    key={a._id}
                    href={`/career-guide/${a.category}/${a.slug}`}
                    className="article-card"
                  >
                    <span className="article-card__badge">{label}</span>
                    <span className="article-card__title">{a.title}</span>
                    {a.description && <span className="article-card__desc">{a.description}</span>}
                    <span className="article-card__more">Read guide →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
