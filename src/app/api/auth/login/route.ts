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

    // Validasi user menggunakan password hash di tabel users
    const { user, error: validationError } = await validateUser(email, password);

    if (validationError === 'EMAIL_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Email tidak terdaftar' },
        { status: 401 }
      );
    }

    if (validationError === 'PASSWORD_WRONG') {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    if (validationError === 'NOT_ADMIN') {
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

    // Generate token sederhana untuk kompatibilitas
    const timestamp = Date.now();
    const accessToken = `access_${user.id}_${timestamp}`;
    const refreshToken = `refresh_${user.id}_${timestamp}`;

    // Set cookie dengan access token dan refresh token
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

    // Set cookie dengan user ID (untuk kompatibilitas)
    response.cookies.set('auth', user.id, {
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

