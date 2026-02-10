'use server';

import { findUserByEmail, findUserByUsername, validateUser } from '@/lib/excel-db';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function registerAction(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validasi input
  if (!username || !email || !password) {
    return { error: 'Semua field harus diisi' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' };
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();
    
    // Cek apakah email sudah terdaftar
    const existingUserByEmail = await findUserByEmail(normalizedEmail);
    
    // Cek juga apakah email adalah admin email dari env
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && normalizedEmail === adminEmail.toLowerCase().trim()) {
      return { error: 'Email sudah terdaftar' };
    }

    if (existingUserByEmail) {
      return { error: 'Email sudah terdaftar' };
    }

    // Cek apakah username sudah terdaftar
    const existingUserByUsername = await findUserByUsername(normalizedUsername);
    if (existingUserByUsername) {
      return { error: 'Username sudah terdaftar' };
    }

    // Hash password sebelum disimpan
    const { hashPassword } = await import('@/lib/hash');
    const hashedPassword = await hashPassword(password);

    // Simpan user baru ke tabel users dengan password yang sudah di-hash
    const { writeUser } = await import('@/lib/excel-db');
    await writeUser({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword, // Password sudah di-hash
      role: 'unemployees',
    });

    // Redirect ke login setelah registrasi berhasil
    redirect('/login?registered=true');
  } catch (error) {
    // Redirect melempar error khusus, re-throw jika itu redirect
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Register error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat registrasi';
    return { error: errorMessage };
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirect') as string | null;

  if (!email || !password) {
    return { error: 'Email dan password harus diisi' };
  }

  try {
    const { user, error } = await validateUser(email, password);

    if (error === 'EMAIL_NOT_FOUND') {
      return { error: 'Email tidak terdaftar' };
    }

    if (error === 'PASSWORD_WRONG') {
      return { error: 'Password salah' };
    }

    if (error === 'NOT_ADMIN') {
      return { error: 'Hanya admin yang dapat login' };
    }

    if (!user) {
      return { error: 'Email atau password salah' };
    }

    // Set cookies untuk autentikasi
    const cookieStore = await cookies();
    
    // Set cookie dengan user ID
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set auth cookie (prioritas utama)
    cookieStore.set('auth', user.id, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    // Set accessToken dan refreshToken
    // Format: prefix_userId_timestamp untuk memudahkan parsing
    const timestamp = Date.now();
    const accessToken = `access_${user.id}_${timestamp}`;
    const refreshToken = `refresh_${user.id}_${timestamp}`;

    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 hari
      path: '/',
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    // Cookies sudah ter-set

    // Revalidate path untuk memastikan data terbaru
    revalidatePath('/');
    revalidatePath('/login');
    
    // Return success dengan user info untuk trigger client-side redirect
    // Redirect di server action tidak bekerja dengan baik dalam startTransition
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return { 
      success: true, 
      redirectTo: redirectTo || '/',
      user: userWithoutPassword 
    };
  } catch (error) {
    // Redirect melempar error khusus, tapi kita sudah tidak menggunakan redirect di sini
    // Jadi kita handle sebagai error biasa
    console.error('Login error:', error);
    return { error: 'Terjadi kesalahan saat login' };
  }
}

