import * as XLSX from 'xlsx';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { hashEmail, comparePassword } from './hash';
import { getDataFilePath } from './data-path';

const DB_PATH = getDataFilePath('users.xlsx');
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
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

// Inisialisasi file Excel jika belum ada
function initializeExcel(): void {
  try {
    // Ensure data directory exists (getDataDir handles this)
    getDataFilePath('users.xlsx'); // This will ensure directory exists

    if (!existsSync(DB_PATH)) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet<User>([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      
      // Gunakan writeFileSync dengan buffer untuk lebih reliable
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
    }
  } catch (error) {
    console.error('Error initializing Excel:', error);
    throw new Error('Gagal menginisialisasi database');
  }
}

// Baca semua user dari Excel dengan retry mechanism
export function readUsers(): User[] {
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      initializeExcel();
      
      // Gunakan readFileSync dengan buffer untuk lebih reliable
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const data = XLSX.utils.sheet_to_json<User>(worksheet);
      return data;
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        // Tunggu sebentar sebelum retry
        const waitTime = (4 - retries) * 100; // 100ms, 200ms, 300ms
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
      }
    }
  }
  
  console.error('Error reading users after retries:', lastError);
  return [];
}

// Tulis user baru ke Excel dengan retry mechanism
// Note: user.password dan user.email sudah harus di-hash sebelum dipanggil
export function writeUser(user: Omit<User, 'id' | 'createdAt'> & { role?: string }): User {
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      initializeExcel();
      
      // Baca users dengan retry
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const users = XLSX.utils.sheet_to_json<User>(worksheet);
      
      // Generate ID menggunakan CUID
      const id = createId();
      const createdAt = new Date().toISOString();
      
      const newUser: User = {
        ...user,
        role: user.role || 'unemployees', // Default role
        id,
        createdAt,
      };
      
      users.push(newUser);
      
      // Tulis kembali ke file
      const newWorkbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(users);
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Users');
      
      // Gunakan writeFileSync dengan buffer untuk lebih reliable
      const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
      
      return newUser;
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        // Tunggu sebentar sebelum retry
        const waitTime = (4 - retries) * 100; // 100ms, 200ms, 300ms
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
      }
    }
  }
  
  console.error('Error writing user after retries:', lastError);
  throw new Error('Gagal menyimpan user ke database. Pastikan file Excel tidak sedang dibuka.');
}

// Get admin user from environment variables
function getAdminUser(): User | null {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  if (!adminEmail || !adminPassword) {
    return null;
  }

  // Hash email untuk admin (konsisten dengan user lain)
  const hashedEmail = hashEmail(adminEmail);

  return {
    id: 'admin_hardcoded',
    username: adminUsername,
    email: hashedEmail, // Email di-hash
    password: adminPassword, // Password tetap plain untuk comparison
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
}

// Cari user berdasarkan email (dengan hash comparison, termasuk admin dari env)
export function findUserByEmail(email: string): User | undefined {
  // Cek admin user dari env terlebih dahulu
  const adminUser = getAdminUser();
  if (adminUser) {
    const adminEmail = process.env.ADMIN_EMAIL;
    // Compare email (case-insensitive dan trim)
    if (adminEmail && email.toLowerCase().trim() === adminEmail.toLowerCase().trim()) {
      return adminUser;
    }
  }

  const users = readUsers();
  // Email di database sudah di-hash, jadi kita perlu hash email yang dicari juga
  const hashedEmail = hashEmail(email);
  
  return users.find(user => {
    // Jika email di database adalah hash (64 karakter hex), compare dengan hash
    if (/^[a-f0-9]{64}$/i.test(user.email)) {
      return user.email === hashedEmail;
    }
    // Backward compatibility: jika email masih plain, compare plain
    return user.email.toLowerCase() === email.toLowerCase();
  });
}

export function findUserByUsername(username: string): User | undefined {
  const users = readUsers();
  return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  const users = readUsers();
  return users.find(user => user.id === id);
}

// Validasi user untuk login (dengan hash comparison, termasuk admin dari env)
// Return: { user: User | null, error: 'EMAIL_NOT_FOUND' | 'PASSWORD_WRONG' | 'NOT_ADMIN' | null }
export async function validateUser(email: string, password: string): Promise<{ user: User | null; error: 'EMAIL_NOT_FOUND' | 'PASSWORD_WRONG' | 'NOT_ADMIN' | null }> {
  const user = findUserByEmail(email);
  
  if (!user) {
    return { user: null, error: 'EMAIL_NOT_FOUND' };
  }
  
  // Cek role - hanya admin yang bisa login
  const userRole = user.role || 'unemployees';
  if (userRole !== 'admin') {
    return { user: null, error: 'NOT_ADMIN' };
  }
  
  // Jika user adalah admin dari env, compare dengan password dari env
  if (user.id === 'admin_hardcoded') {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword && password === adminPassword) {
      return { user, error: null };
    }
    return { user: null, error: 'PASSWORD_WRONG' };
  }
  
  // Cek apakah password adalah bcrypt hash
  const isBcryptHash = user.password.startsWith('$2a$') || 
                       user.password.startsWith('$2b$') || 
                       user.password.startsWith('$2y$');
  
  if (isBcryptHash) {
    // Password di-hash, gunakan comparePassword
    const isPasswordValid = await comparePassword(password, user.password);
    if (isPasswordValid) {
      return { user, error: null };
    }
    return { user: null, error: 'PASSWORD_WRONG' };
  } else {
    // Backward compatibility: password masih plain
    if (user.password === password) {
      return { user, error: null };
    }
    return { user: null, error: 'PASSWORD_WRONG' };
  }
}
