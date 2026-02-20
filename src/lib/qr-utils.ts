import QRCode from 'qrcode';




// Generate QR code untuk stock item
export async function generateStockQR(stockId: string): Promise<string> {
  // Determine base URL:
  // 1. NEXT_PUBLIC_BASE_URL (Manual override)
  // 2. VERCEL_PROJECT_PRODUCTION_URL (Production URL on Vercel)
  // 3. VERCEL_URL (Preview/Production URL on Vercel - needs https://)
  // 4. Fallback to localhost
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      baseUrl = 'http://localhost:3000';
    }
  }

  // QR code akan redirect ke cashier dengan query param untuk auto-add
  const qrUrl = `${baseUrl}/cashier?add=${stockId}`;
  
  // Generate QR code sebagai Data URL (base64)
  // Ini menghindari tulis ke filesystem yang read-only di Vercel
  const dataUrl = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 256,
    margin: 1,
  });
  
  return dataUrl;
}

// Generate QR code sebagai data URL (untuk download)
export async function generateStockQRDataURL(stockId: string): Promise<string> {
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      baseUrl = 'http://localhost:3000';
    }
  }

  const qrUrl = `${baseUrl}/cashier?add=${stockId}`;
  
  // Generate QR code sebagai data URL
  const dataUrl = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 256,
    margin: 1,
  });
  
  return dataUrl;
}

