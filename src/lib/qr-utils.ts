import QRCode from 'qrcode';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createId } from '@paralleldrive/cuid2';

const QR_DIR = join(process.cwd(), 'public', 'qrcodes');

// Pastikan directory QR ada
function ensureQrDir(): void {
  if (!existsSync(QR_DIR)) {
    mkdirSync(QR_DIR, { recursive: true });
  }
}

// Generate QR code untuk stock item
export async function generateStockQR(stockId: string): Promise<string> {
  ensureQrDir();
  
  // QR code akan redirect ke cashier dengan query param untuk auto-add
  const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cashier?add=${stockId}`;
  const filename = `${stockId}.png`;
  const filePath = join(QR_DIR, filename);
  
  // Generate QR code sebagai PNG
  await QRCode.toFile(filePath, qrUrl, {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 256,
    margin: 1,
  });
  
  // Return path relatif untuk public URL
  return `/qrcodes/${filename}`;
}

// Generate QR code sebagai data URL (untuk download)
export async function generateStockQRDataURL(stockId: string): Promise<string> {
  const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cashier?add=${stockId}`;
  
  // Generate QR code sebagai data URL
  const dataUrl = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 256,
    margin: 1,
  });
  
  return dataUrl;
}

