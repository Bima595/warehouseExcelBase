import QRCode from 'qrcode';




// Generate QR code untuk stock item
export async function generateStockQR(stockId: string): Promise<string> {
  // QR code akan redirect ke cashier dengan query param untuk auto-add
  const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cashier?add=${stockId}`;
  
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

