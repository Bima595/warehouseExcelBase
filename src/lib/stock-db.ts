import * as XLSX from 'xlsx';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { createId } from '@paralleldrive/cuid2';
import { getDataFilePath } from './data-path';

const DB_PATH = getDataFilePath('stock.xlsx');

export interface Stock {
  id: string;
  namaBarang: string;
  stock: number;
  hargaBeli: number;
  hargaJual: number;
  gambar?: string; // Path ke gambar
  qrCode?: string; // Path ke QR code image
  deletedAt?: string; // Untuk soft delete
  createdAt: string;
  updatedAt: string;
}

export interface StockWithoutDeleted extends Omit<Stock, 'deletedAt'> {}

// Inisialisasi file Excel jika belum ada
function initializeExcel(): void {
  try {
    // Ensure data directory exists (getDataDir handles this)
    getDataFilePath('stock.xlsx'); // This will ensure directory exists

    if (!existsSync(DB_PATH)) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet<Stock>([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
    }
  } catch (error) {
    console.error('Error initializing Stock Excel:', error);
    throw new Error('Gagal menginisialisasi database stock');
  }
}

// Baca semua stock dari Excel (tanpa yang di-delete)
export function readStocks(): StockWithoutDeleted[] {
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      initializeExcel();
      
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const stocks = XLSX.utils.sheet_to_json<Stock>(worksheet);
      
      // Filter out soft deleted items
      const activeStocks = stocks
        .filter(stock => !stock.deletedAt)
        .map(({ deletedAt, ...stock }) => stock);
      
      return activeStocks;
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
      }
    }
  }
  
  console.error('Error reading stocks after retries:', lastError);
  return [];
}

// Baca semua stock termasuk yang di-delete (untuk admin)
export function readAllStocks(): Stock[] {
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      initializeExcel();
      
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      return XLSX.utils.sheet_to_json<Stock>(worksheet);
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
      }
    }
  }
  
  console.error('Error reading all stocks after retries:', lastError);
  return [];
}

// Tulis stock baru ke Excel
export function writeStock(stock: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>): Stock {
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      initializeExcel();
      
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const stocks = XLSX.utils.sheet_to_json<Stock>(worksheet);
      
      const id = createId();
      const now = new Date().toISOString();
      
      const newStock: Stock = {
        ...stock,
        id,
        createdAt: now,
        updatedAt: now,
      };
      
      stocks.push(newStock);
      
      const newWorkbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(stocks);
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Stock');
      
      const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
      
      return newStock;
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
      }
    }
  }
  
  console.error('Error writing stock after retries:', lastError);
  throw new Error('Gagal menyimpan stock ke database. Pastikan file Excel tidak sedang dibuka.');
}

// Update stock
export function updateStock(id: string, updates: Partial<Omit<Stock, 'id' | 'createdAt'>>): Stock {
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      initializeExcel();
      
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const stocks = XLSX.utils.sheet_to_json<Stock>(worksheet);
      
      const index = stocks.findIndex(stock => stock.id === id);
      if (index === -1) {
        throw new Error('Stock tidak ditemukan');
      }
      
      stocks[index] = {
        ...stocks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      const newWorkbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(stocks);
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Stock');
      
      const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
      
      return stocks[index];
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
      }
    }
  }
  
  console.error('Error updating stock after retries:', lastError);
  throw new Error('Gagal mengupdate stock. Pastikan file Excel tidak sedang dibuka.');
}

// Soft delete stock
export function deleteStock(id: string): void {
  updateStock(id, { deletedAt: new Date().toISOString() });
}

// Cari stock berdasarkan ID
export function findStockById(id: string): Stock | undefined {
  const stocks = readAllStocks();
  return stocks.find(stock => stock.id === id);
}

