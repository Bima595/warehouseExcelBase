import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Get data directory path
 * In production (Vercel), use /tmp because file system is read-only
 * In development, use ./data directory
 */
export function getDataDir(): string {
  // Check if we're in Vercel/production environment
  // Vercel sets VERCEL=1 environment variable
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    // Use /tmp in production (Vercel allows writing to /tmp)
    const tmpDir = '/tmp/data';
    try {
      if (!existsSync(tmpDir)) {
        mkdirSync(tmpDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating /tmp/data directory:', error);
      // Fallback to /tmp if /tmp/data fails
      return '/tmp';
    }
    return tmpDir;
  }
  
  // Use local data directory in development
  const localDir = join(process.cwd(), 'data');
  try {
    if (!existsSync(localDir)) {
      mkdirSync(localDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
    throw error;
  }
  return localDir;
}

/**
 * Get path for a specific data file
 */
export function getDataFilePath(filename: string): string {
  return join(getDataDir(), filename);
}

