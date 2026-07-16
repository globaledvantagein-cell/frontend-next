import type { Metadata } from 'next';
import Home from '@/page-components/Home';

export const metadata: Metadata = {
  title: 'English Jobs in Germany — No German Required',
  description:
    'Find English-speaking jobs in Germany across Berlin, Munich, Hamburg and more. No German language required — every role is checked before it is listed.',
  alternates: { canonical: '/' },
};

// The homepage chrome (hero, role ticker, jobs-by-city / jobs-by-category
// internal links) server-renders in the initial HTML; the latest-jobs grid and
// company carousel hydrate client-side via Home's own fetches.
export default function HomePage() {
  return <Home />;
}
