import type { Metadata } from 'next';
import { Suspense } from 'react';
import Dashboard from '@/page-components/Dashboard';

export const metadata: Metadata = {
  title: 'Browse English-Speaking Jobs in Germany',
  description:
    'Search and filter English-speaking jobs across Germany by city, category, and company. No German required.',
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
