import { NextRequest, NextResponse } from 'next/server';
import { writeUser, findUserByEmail, findUserByUsername } from '@/lib/excel-db';
import { hashPassword, hashEmail } from '@/lib/hash';

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

    // Cek apakah email sudah terdaftar (termasuk admin dari env)
    let existingUserByEmail;
    try {
      existingUserByEmail = findUserByEmail(email);
      
      // Cek juga apakah email adalah admin email dari env
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // Continue jika error, akan di-handle saat write
    }

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Cek apakah username sudah terdaftar (dengan error handling)
    let existingUserByUsername;
    try {
      existingUserByUsername = findUserByUsername(username);
    } catch (error) {
      console.error('Error checking username:', error);
      // Continue jika error, akan di-handle saat write
    }

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password dan email di server side sebelum disimpan
    const hashedPassword = await hashPassword(password);
    const hashedEmail = hashEmail(email);
    
    // Buat user baru dengan role default "unemployees"
    // Password dan email sudah di-hash di server side
    const newUser = writeUser({
      username,
      email: hashedEmail, // Email sudah di-hash
      password: hashedPassword, // Password sudah di-hash
      role: 'unemployees', // Role default untuk user yang register
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

