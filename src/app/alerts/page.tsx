import { Suspense } from 'react';
import Alerts from '@/page-components/Alerts';

export const metadata = {
  title: 'Weekly Job Alerts',
  description: 'Get a weekly digest of new English-speaking jobs in Germany.',
  alternates: { canonical: '/alerts' },
};

export default function AlertsPage() {
  return (
    <Suspense fallback={null}>
      <Alerts />
    </Suspense>
  );
}
