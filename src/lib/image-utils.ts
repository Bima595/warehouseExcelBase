// Server-only module - do not import in client components
import { createId } from '@paralleldrive/cuid2';
import { supabase } from './supabase';

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

const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 80;

// Compress dan save image
// Compress dan save image ke Supabase Storage
export async function compressAndSaveImage(
  imageBuffer: Buffer,
  originalFilename: string
): Promise<string> {
  const fileExtension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${createId()}.${fileExtension}`;
  
  // Get sharp instance (server-side only)
  const sharp = await getSharp();
  
  // Compress image dengan sharp
  const compressedBuffer = await sharp(imageBuffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY })
    .toBuffer();
  
  // Upload ke Supabase Storage
  // Pastikan bucket 'stock-images' sudah dibuat di Supabase Dashboard
  const { error } = await supabase.storage
    .from('stock-images')
    .upload(filename, compressedBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image to Supabase:', error);
    throw new Error('Gagal mengupload gambar ke penyimpanan cloud.');
  }
  
  // Return public URL
  const { data: { publicUrl } } = supabase.storage
    .from('stock-images')
    .getPublicUrl(filename);
    
  return publicUrl;
}

// Convert base64 to buffer
export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

