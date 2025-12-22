import RegisterForm from '@/components/auth/RegisterForm';
import AnimatedBackground from '@/components/ui/animated-background';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}

