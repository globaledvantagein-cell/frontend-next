import type { MetadataRoute } from 'next';
import { CANONICAL_CITIES } from '@/data/cities';
import { CATEGORY_SLUGS } from '@/utils/categorize';
import { CAREER_GUIDE_CATEGORIES } from '@/data/careerGuide';
import { fetchPublishedArticles, fetchJobs, SITE_URL } from '@/lib/serverApi';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${SITE_URL}/jobs`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    // The remote vertical is a single filterable page — there are no
    // /remote-jobs/[id] detail routes (jobs are deep-linked as ?id=), so
    // nothing further to enumerate here.
    { url: `${SITE_URL}/remote-jobs`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${SITE_URL}/directory`, changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { url: `${SITE_URL}/alerts`, changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${SITE_URL}/legal`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
    { url: `${SITE_URL}/career-guide`, changeFrequency: 'weekly', priority: 0.8, lastModified: now },
  ];

  for (const c of CATEGORY_SLUGS) {
    entries.push({ url: `${SITE_URL}/category/${c}`, changeFrequency: 'daily', priority: 0.8, lastModified: now });
  }
  for (const city of CANONICAL_CITIES) {
    entries.push({ url: `${SITE_URL}/city/${city.slug}`, changeFrequency: 'daily', priority: 0.7, lastModified: now });
  }

  const articles = await fetchPublishedArticles();
  const nonEmptyCats = new Set(articles.map((a) => a.category));
  for (const cat of CAREER_GUIDE_CATEGORIES) {
    if (nonEmptyCats.has(cat)) {
      entries.push({ url: `${SITE_URL}/career-guide/${cat}`, changeFrequency: 'weekly', priority: 0.7, lastModified: now });
    }
  }
  for (const a of articles) {
    entries.push({
      url: `${SITE_URL}/career-guide/${a.category}/${a.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
      lastModified: a.updatedAt || a.publishedAt ? new Date(a.updatedAt || a.publishedAt!) : now,
    });
  }

  // Individual job pages — the highest-value SEO URLs. The API caps limit at
  // 100 per page, so pull the 1000 newest in parallel pages; failures degrade
  // to fewer entries rather than breaking the sitemap.
  const pages = await Promise.all(
    Array.from({ length: 10 }, (_, i) => fetchJobs({ limit: 100, page: i + 1 }).catch(() => ({ jobs: [] }))),
  );
  for (const p of pages) {
    for (const job of p.jobs || []) {
      entries.push({
        url: `${SITE_URL}/jobs/${job._id}`,
        changeFrequency: 'weekly',
        priority: 0.6,
        lastModified: job.PostedDate ? new Date(job.PostedDate) : now,
      });
    }
  }

  return entries;
}
