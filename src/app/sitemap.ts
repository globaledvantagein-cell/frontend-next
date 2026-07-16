import type { MetadataRoute } from 'next';
import { CANONICAL_CITIES } from '@/data/cities';
import { CATEGORY_ORDER } from '@/utils/categorize';
import { CAREER_GUIDE_CATEGORIES } from '@/data/careerGuide';
import { fetchPublishedArticles, SITE_URL } from '@/lib/serverApi';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${SITE_URL}/jobs`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${SITE_URL}/directory`, changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { url: `${SITE_URL}/alerts`, changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${SITE_URL}/legal`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
    { url: `${SITE_URL}/career-guide`, changeFrequency: 'weekly', priority: 0.8, lastModified: now },
  ];

  for (const c of CATEGORY_ORDER) {
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

  return entries;
}
