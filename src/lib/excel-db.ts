import { supabase } from './supabase';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Password yang sudah di-hash
  role?: string;
  createdAt: string;
}

export interface UserWithoutPassword {
  id: string;
  username: string;
  email: string;
  role?: string;
  createdAt: string;
}

// Baca semua user dari Supabase (exclude soft deleted)
export async function readUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null) // Filter out soft deleted users
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error reading users:', error);
      return [];
    }

    // Transform data dari Supabase ke format User
    return (data || []).map((user) => ({
      id: user.id,
      username: user.username || '',
      email: user.email || '',
      password: user.password || '', // Password hash dari database
      role: user.role || 'unemployees',
      createdAt: user.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// Tulis user baru ke Supabase
// Note: user.password harus sudah di-hash sebelum dipanggil
export async function writeUser(user: Omit<User, 'id' | 'createdAt'> & { role?: string }): Promise<User> {
  try {
    const { createId } = await import('@paralleldrive/cuid2');
    const id = createId();

    const { data, error } = await supabase
      .from('users')
      .insert({
        id, // Generate ID baru (tidak perlu reference ke auth.users)
        username: user.username,
        email: user.email,
        password: user.password, // Password yang sudah di-hash
        role: user.role || 'unemployees',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error writing user:', error);
      throw new Error(`Gagal menyimpan user ke database: ${error.message}`);
    }

    if (!data) {
      throw new Error('Gagal menyimpan user ke database: tidak ada data yang dikembalikan');
    }

    return {
      id: data.id,
      username: data.username || '',
      email: data.email || '',
      password: data.password || '', // Password hash disimpan di database
      role: data.role || 'unemployees',
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error writing user:', error);
    throw error instanceof Error ? error : new Error('Gagal menyimpan user ke database');
  }
}

// Cari user berdasarkan email
export async function findUserByEmail(email: string): Promise<User | undefined> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle(); // maybeSingle() tidak throw error jika tidak ada data

    if (data && !error) {
      // Debug: log data yang diambil dari database
      console.log('User found by email:', {
        id: data.id,
        email: data.email,
        role: data.role,
        roleType: typeof data.role,
        roleLength: data.role?.length
      });
      
      return {
        id: data.id,
        username: data.username || '',
        email: data.email || '',
        password: data.password || '', // Password hash dari database
        role: (data.role || 'unemployees').trim(), // Trim whitespace dari role
        createdAt: data.created_at || new Date().toISOString(),
      };
    }
    
    return undefined;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return undefined;
  }
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      username: data.username || '',
      email: data.email || '',
      password: data.password || '', // Password hash dari database
      role: (data.role || 'unemployees').trim(), // Trim whitespace dari role
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error finding user by username:', error);
    return undefined;
  }
}

export async function findUserById(id: string): Promise<User | undefined> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      username: data.username || '',
      email: data.email || '',
      password: data.password || '', // Password hash dari database
      role: (data.role || 'unemployees').trim(), // Trim whitespace dari role
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error finding user by id:', error);
    return undefined;
  }
}

// Validasi user untuk login (menggunakan credentials dari .env)
// Return: { user: User | null, error: 'EMAIL_NOT_FOUND' | 'PASSWORD_WRONG' | 'NOT_ADMIN' | null }
export async function validateUser(email: string, password: string): Promise<{ user: User | null; error: 'EMAIL_NOT_FOUND' | 'PASSWORD_WRONG' | 'NOT_ADMIN' | null }> {
  try {
    // Ambil credentials dari environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    // Validasi environment variables
    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables');
      return { user: null, error: 'EMAIL_NOT_FOUND' };
    }
    
    // Normalize input email
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedAdminEmail = adminEmail.toLowerCase().trim();
    
    // Cek apakah email cocok dengan admin email
    if (normalizedEmail !== normalizedAdminEmail) {
      console.log('Login rejected - email does not match admin email');
      return { user: null, error: 'EMAIL_NOT_FOUND' };
    }

    // Cek password (plain text comparison)
    if (password !== adminPassword) {
      console.log('Login rejected - password does not match');
      return { user: null, error: 'PASSWORD_WRONG' };
    }

    // Buat user object untuk admin dengan hardcoded ID
    const adminUser: User = {
      id: 'admin_hardcoded', // Gunakan ID yang konsisten untuk admin
      username: adminUsername,
      email: adminEmail,
      password: '', // Jangan return password
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    console.log('Admin login successful:', { 
      email: adminUser.email,
      username: adminUser.username,
      role: adminUser.role
    });

    return { user: adminUser, error: null };
  } catch (error) {
    console.error('Error validating user:', error);
    return { user: null, error: 'EMAIL_NOT_FOUND' };
  }
}
