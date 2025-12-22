import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import CashierPage from '@/components/cashier/CashierPage';

export default async function CashierPageWrapper() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  return <CashierPage />;
}
