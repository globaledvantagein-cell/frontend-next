import AuthGuard from '@/components/AuthGuard';
import SmartMatch from '@/page-components/SmartMatch';

export const metadata = { title: 'Smart Match', robots: { index: false } };

export default function SmartMatchPage() {
  return (
    <AuthGuard requireAdmin>
      <SmartMatch />
    </AuthGuard>
  );
}
