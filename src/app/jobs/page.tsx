import type { Metadata } from 'next';
import { Suspense } from 'react';
import Dashboard from '@/page-components/Dashboard';

export const metadata: Metadata = {
  title: 'Jobs in Germany for English Speakers — Browse All Roles',
  description:
    'Find jobs in Germany for English speakers, expats and internationals. Search and filter English-speaking roles by city, category, salary and company. No German required.',
  alternates: { canonical: '/jobs' },
};

export default function JobsPage() {
  // Dashboard reads ?company= / ?id= via useSearchParams → needs Suspense.
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
