import type { Metadata } from 'next';
import CompanyDirectory from '@/page-components/CompanyDirectory';

export const metadata: Metadata = {
  title: 'Companies Hiring English Speakers in Germany',
  description:
    'Browse companies in Germany hiring English speakers, with open-role counts and locations. No German required.',
  alternates: { canonical: '/directory' },
};

export default function DirectoryPage() {
  return <CompanyDirectory />;
}
