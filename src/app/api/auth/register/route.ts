import { NextRequest, NextResponse } from 'next/server';
import { writeUser, findUserByEmail, findUserByUsername } from '@/lib/excel-db';
import { hashPassword } from '@/lib/hash';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validasi input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUserByEmail = await findUserByEmail(email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Cek apakah username sudah terdaftar
    const existingUserByUsername = await findUserByUsername(username);
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password sebelum disimpan
    const hashedPassword = await hashPassword(password);

    // Simpan user baru ke tabel users dengan password yang sudah di-hash
    const newUser = await writeUser({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword, // Password sudah di-hash
      role: 'unemployees',
    });

    // Hapus password dari response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    
    // Berikan error message yang lebih spesifik
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat registrasi';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
