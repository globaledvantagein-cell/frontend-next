import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJobFull, SITE_URL } from '@/lib/serverApi';
import JobSharePage from '@/page-components/JobSharePage';
import JsonLd, { jobPostingJsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const res = await fetchJobFull(id);
  const job = res?.job || res?.teaser;
  if (!job) {
    // Safety net — the page itself calls notFound() (real 404), but if it's
    // ever rendered, keep it out of the index.
    return { title: 'Job not found — English Jobs Germany', robots: { index: false, follow: false } };
  }
  const title = `${job.JobTitle} at ${job.Company} — English Jobs Germany`;
  const rawDesc = (job.Description || '').replace(/\s+/g, ' ').trim();
  const description = rawDesc
    ? rawDesc.slice(0, 155)
    : `${job.JobTitle} at ${job.Company} — an English-speaking role in Germany. No German required.`;
  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job._id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/jobs/${job._id}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// The interactive detail (apply / share / save / gating) is fully client-side.
// The server component supplies crawlable metadata, OG tags, and JobPosting
// JSON-LD (Google for Jobs / AI answer-engine eligibility).
export default async function JobDetailRoute({ params }: Params) {
  const { id } = await params;
  const res = await fetchJobFull(id);
  // Missing or inactive job → the backend returns null (non-2xx). Return a real
  // HTTP 404 (renders not-found.tsx) instead of a soft-404 that wastes crawl
  // budget. A gated-but-valid job (res.teaser only) is NOT a 404.
  if (!res || (!res.job && !res.teaser)) notFound();
  const job = res.job || res.teaser;
  return (
    <>
      {job && <JsonLd data={jobPostingJsonLd(job, SITE_URL)} />}
      {job && (
        <JsonLd data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Jobs', url: `${SITE_URL}/jobs` },
          { name: `${job.JobTitle} at ${job.Company}`, url: `${SITE_URL}/jobs/${job._id}` },
        ])} />
      )}
      {/* Seed the client page with the full server-fetched job (crawlable HTML +
          instant first paint); the client re-fetches to apply auth-aware gating. */}
      <JobSharePage initialJob={res.job ?? null} />
    </>
  );
}
