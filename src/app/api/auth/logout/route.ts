import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout berhasil' },
    { status: 200 }
  );

  // Hapus semua cookie autentikasi
  response.cookies.delete('auth');
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');

  return response;
}

