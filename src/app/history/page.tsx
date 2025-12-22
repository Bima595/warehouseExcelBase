import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import HistoryPage from '@/components/history/HistoryPage';

export default async function HistoryPageWrapper() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  return (
    <div className="w-full">
      <HistoryPage />
    </div>
  );
}

