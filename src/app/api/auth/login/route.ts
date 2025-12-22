import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/excel-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    const { user, error } = await validateUser(email, password);

    if (error === 'EMAIL_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Email tidak terdaftar' },
        { status: 401 }
      );
    }

    if (error === 'PASSWORD_WRONG') {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }

    if (error === 'NOT_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya admin yang dapat login' },
        { status: 403 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Hapus password dari response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // Set cookie untuk autentikasi
    const response = NextResponse.json(
      {
        message: 'Login berhasil',
        user: userWithoutPassword,
      },
      { status: 200 }
    );

    // Set cookie dengan user ID (untuk kompatibilitas)
    response.cookies.set('auth', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    // Set accessToken dan refreshToken untuk Next.js 16
    // Generate token sederhana (dalam production, gunakan JWT atau token yang lebih aman)
    const accessToken = `access_${user.id}_${Date.now()}`;
    const refreshToken = `refresh_${user.id}_${Date.now()}`;

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 hari
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}

