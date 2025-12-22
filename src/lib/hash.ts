import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Hash password menggunakan bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password dengan hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Hash email menggunakan SHA256 (deterministic untuk pencarian)
export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Compare email dengan hash
export function compareEmail(email: string, hash: string): boolean {
  const emailHash = hashEmail(email);
  return emailHash === hash;
}

