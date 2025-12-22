import { cookies } from 'next/headers';
import { findUserById, type UserWithoutPassword } from './excel-db';

export async function getAuthUser(): Promise<UserWithoutPassword | null> {
  const cookieStore = await cookies();
  
  // Cek accessToken, refreshToken, atau auth cookie
  const accessToken = cookieStore.get('accessToken');
  const refreshToken = cookieStore.get('refreshToken');
  const authCookie = cookieStore.get('auth');

  // Debug logging dihapus untuk mengurangi noise

  // Jika tidak ada token sama sekali
  if (!accessToken && !refreshToken && !authCookie) {
    return null;
  }

  // Prioritaskan auth cookie, lalu extract dari token
  let userId: string | null = null;
  
  if (authCookie?.value) {
    userId = authCookie.value;
  } else if (accessToken?.value) {
    // Format: access_userId_timestamp
    // Contoh: access_admin_hardcoded_1766419045949
    // Split by '_' dan ambil semua bagian kecuali yang pertama (access) dan terakhir (timestamp)
    const parts = accessToken.value.split('_');
    if (parts.length >= 3) {
      // Gabungkan semua bagian kecuali yang pertama (access) dan terakhir (timestamp)
      // Untuk "access_admin_hardcoded_1766419045949" -> ["access", "admin", "hardcoded", "1766419045949"]
      // Kita ambil "admin_hardcoded"
      userId = parts.slice(1, -1).join('_');
    }
  } else if (refreshToken?.value) {
    // Format: refresh_userId_timestamp
    const parts = refreshToken.value.split('_');
    if (parts.length >= 3) {
      userId = parts.slice(1, -1).join('_');
    }
  }

  if (!userId) {
    return null;
  }

  try {
    // Cek jika user adalah admin dari env
    if (userId === 'admin_hardcoded') {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      
      if (adminEmail) {
        return {
          id: 'admin_hardcoded',
          username: adminUsername,
          email: adminEmail, // Return plain email untuk display
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
      }
      return null;
    }

    // Cari user dari database Excel
    const user = findUserById(userId);
    if (!user) {
      return null;
    }

    // Hapus password dari return value
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

