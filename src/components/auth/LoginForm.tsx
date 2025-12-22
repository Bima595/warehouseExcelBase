'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { PasswordInputWithIcon } from '@/components/ui/password-input-with-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginAction } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Cek jika ada parameter registered
    if (searchParams.get('registered') === 'true') {
      toast({
        variant: 'success',
        title: 'Registrasi Berhasil',
        description: 'Silakan login dengan akun Anda.',
      });
      // Hapus parameter dari URL setelah ditampilkan
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('registered');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const formDataObj = new FormData();
        formDataObj.append('email', formData.email);
        formDataObj.append('password', formData.password);
        const redirectTo = searchParams.get('redirect') || '/';
        formDataObj.append('redirect', redirectTo);

        const result = await loginAction(formDataObj);
        
        if (result?.error) {
          toast({
            variant: 'destructive',
            title: 'Login Gagal',
            description: result.error,
          });
        } else if (result?.success) {
          // Simpan user info di localStorage untuk client-side
          if (result.user) {
            localStorage.setItem('user', JSON.stringify(result.user));
          }
          
          // Login berhasil, redirect ke halaman yang diminta
          toast({
            variant: 'success',
            title: 'Login Berhasil',
            description: 'Selamat datang kembali!',
          });
          
          // Redirect setelah toast muncul dan pastikan cookie sudah ter-set
          // Gunakan window.location.href untuk full page reload yang memastikan cookie ter-baca
          setTimeout(() => {
            // Force reload untuk memastikan cookie ter-baca oleh server
            window.location.href = result.redirectTo || '/';
          }, 300);
        }
      } catch (error) {
        // Ignore redirect errors (NEXT_REDIRECT)
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
          // Redirect sudah dilakukan di server, tidak perlu handle
          return;
        }
        // Handle other errors
        toast({
          variant: 'destructive',
          title: 'Login Gagal',
          description: 'Terjadi kesalahan saat login',
        });
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Selamat Datang</CardTitle>
          <CardDescription className="text-base">
            Masuk ke akun Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <InputWithIcon
                id="email"
                name="email"
                type="email"
                placeholder="nama@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-11"
                icon={Mail}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <PasswordInputWithIcon
                id="password"
                name="password"
                placeholder="Masukkan password Anda"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11"
                icon={Lock}
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isPending}>
              {isPending ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Belum punya akun? </span>
            <Link
              href="/register"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Daftar sekarang
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
