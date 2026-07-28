import type { Metadata } from 'next';
import Home from '@/page-components/Home';
import { fetchBaitJobs, fetchDirectory, fetchPublishedArticles, fetchJobs } from '@/lib/serverApi';
import { estimateReadingMinutes } from '@/lib/markdown';

// The whole homepage — hero, latest-jobs grid, company logos, career-guide
// preview, and city/category link grid — is server-rendered and cached/
// revalidated every 30 min (ISR), so all of it appears in the initial HTML as
// crawlable links (Googlebot doesn't run useEffect).
export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'English Jobs in Germany — No German Required',
  description:
    'Find English-speaking jobs in Germany across Berlin, Munich, Hamburg and more. No German language required — every role is checked before it is listed.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  // Parallel server fetches, all on the same 30-min ISR window as the page.
  const [initialJobs, allCompanies, allArticles, jobStats] = await Promise.all([
    fetchBaitJobs(1800),
    fetchDirectory(1800),
    fetchPublishedArticles(1800),
    fetchJobs({ limit: 1, revalidate: 1800 }), // cheap total-count query
  ]);

  // 3 most-recent articles, reduced to a small serializable shape (reading time
  // computed on the server so the markdown util stays out of the client bundle).
  const articles = [...allArticles]
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .slice(0, 3)
    .map(a => ({
      title: a.title,
      slug: a.slug,
      category: a.category,
      readingMinutes: estimateReadingMinutes(a.content),
    }));

  return (
    <Home
      initialJobs={initialJobs}
      initialCompanies={allCompanies.slice(0, 12)}
      companyCount={allCompanies.length}
      articles={articles}
      totalJobCount={jobStats.totalJobs}
    />
  );
}
