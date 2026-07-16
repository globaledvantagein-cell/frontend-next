import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { fetchArticleBySlug, SITE_URL } from '@/lib/serverApi';
import { careerCategoryLabel } from '@/data/careerGuide';
import { renderMarkdown } from '@/lib/markdown';
import JsonLd, { breadcrumbJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string; slug: string }> };

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
  const html = renderMarkdown(article.content);
  const pageUrl = `${SITE_URL}/career-guide/${article.category}/${slug}`;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,24px)' }}>
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

      <nav aria-label="Breadcrumb" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        <Link href="/" style={{ color: 'inherit' }}>Home</Link>
        {' › '}
        <Link href="/career-guide" style={{ color: 'inherit' }}>Career Guide</Link>
        {' › '}
        <Link href={`/career-guide/${article.category}`} style={{ color: 'inherit' }}>{label}</Link>
        {' › '}
        <span style={{ color: 'var(--text-primary)' }}>{article.title}</span>
      </nav>

      <article>
        <h1 style={{ fontSize: 'clamp(1.7rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
          {article.title}
        </h1>
        <div
          className="job-description-html"
          style={{ marginTop: 24, color: 'var(--text-primary)', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
