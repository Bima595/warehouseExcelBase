'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Hapus dari localStorage
      localStorage.removeItem('user');
      
      // Redirect ke login
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="destructive" 
      className="relative z-10 cursor-pointer"
    >
      Logout
    </Button>
  );
}


