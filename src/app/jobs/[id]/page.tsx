import type { Metadata } from 'next';
import { fetchJobFull, SITE_URL } from '@/lib/serverApi';
import JobSharePage from '@/page-components/JobSharePage';
import JsonLd, { jobPostingJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const res = await fetchJobFull(id);
  const job = res?.job || res?.teaser;
  if (!job) {
    return { title: 'Job not found — English Jobs Germany' };
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
  const job = res?.job || res?.teaser;
  return (
    <>
      {job && <JsonLd data={jobPostingJsonLd(job, SITE_URL)} />}
      <JobSharePage />
    </>
  );
}
