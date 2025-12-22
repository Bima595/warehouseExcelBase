// Server-only module - do not import in client components
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createId } from '@paralleldrive/cuid2';

// Dynamic import untuk sharp (server-side only, menghindari bundling issues)
async function getSharp() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp');
    return sharp;
  } catch (error) {
    console.error('Error loading sharp:', error);
    throw new Error('Sharp tidak dapat dimuat. Pastikan sharp terinstall dengan benar.');
  }
}

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 80;

// Pastikan directory upload ada
function ensureUploadDir(): void {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Compress dan save image
export async function compressAndSaveImage(
  imageBuffer: Buffer,
  originalFilename: string
): Promise<string> {
  ensureUploadDir();
  
  const fileExtension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${createId()}.${fileExtension}`;
  const filePath = join(UPLOAD_DIR, filename);
  
  // Get sharp instance (server-side only)
  const sharp = await getSharp();
  
  // Compress image dengan sharp
  await sharp(imageBuffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY })
    .toFile(filePath);
  
  // Return path relatif untuk public URL
  return `/uploads/${filename}`;
}

// Convert base64 to buffer
export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

