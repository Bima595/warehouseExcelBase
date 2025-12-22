'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { PasswordInputWithIcon } from '@/components/ui/password-input-with-icon';
import { PasswordStrength } from '@/components/ui/password-strength';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { registerAction } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';

export default function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const passwordMatch = formData.password && formData.confirmPassword 
    ? formData.password === formData.confirmPassword 
    : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validasi password
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password dan konfirmasi password tidak cocok',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password minimal 6 karakter',
      });
      return;
    }

    startTransition(async () => {
      const formDataObj = new FormData();
      formDataObj.append('username', formData.username);
      formDataObj.append('email', formData.email);
      formDataObj.append('password', formData.password);

      const result = await registerAction(formDataObj);
      
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Registrasi Gagal',
          description: result.error,
        });
      }
      // Jika tidak ada error, redirect akan dilakukan di server action
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
          <CardTitle className="text-3xl font-bold tracking-tight">Buat Akun</CardTitle>
          <CardDescription className="text-base">
            Daftar untuk memulai menggunakan aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Username
              </label>
              <InputWithIcon
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={handleChange}
                required
                className="h-11"
                icon={User}
              />
            </div>

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
                placeholder="Minimal 8 karakter"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11"
                icon={Lock}
              />
              {formData.password && <PasswordStrength password={formData.password} />}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Konfirmasi Password
              </label>
              <div className="relative">
                <PasswordInputWithIcon
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={cn(
                    'h-11',
                    passwordMatch === false && 'border-red-500 focus-visible:ring-red-500',
                    passwordMatch === true && 'border-green-500 focus-visible:ring-green-500'
                  )}
                  icon={Lock}
                />
                {formData.confirmPassword && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    {passwordMatch === true ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : passwordMatch === false ? (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : null}
                  </div>
                )}
              </div>
              {formData.confirmPassword && passwordMatch === false && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Password tidak cocok
                </p>
              )}
              {formData.confirmPassword && passwordMatch === true && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Password cocok
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isPending || passwordMatch === false}>
              {isPending ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Sudah punya akun? </span>
            <Link
              href="/login"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Masuk sekarang
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
