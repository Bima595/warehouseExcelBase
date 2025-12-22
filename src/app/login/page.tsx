import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import AnimatedBackground from '@/components/ui/animated-background';

function LoginFormWrapper() {
  return (
    <Suspense fallback={
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-lg border bg-card p-6 shadow-lg">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-4"></div>
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-md">
        <LoginFormWrapper />
      </div>
    </div>
  );
}

