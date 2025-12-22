'use server';

import { readFileSync, existsSync } from 'fs';
import { getDataFilePath } from '@/lib/data-path';

export async function downloadExcelFile(filename: 'users.xlsx' | 'stock.xlsx' | 'transactions.xlsx') {
  try {
    const filePath = getDataFilePath(filename);
    
    if (!existsSync(filePath)) {
      return { error: `File ${filename} tidak ditemukan` };
    }

    const fileBuffer = readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    return {
      success: true,
      filename,
      data: base64,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return { error: `Gagal membaca file ${filename}` };
  }
}

