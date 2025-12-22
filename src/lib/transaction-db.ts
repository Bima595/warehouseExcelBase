import * as XLSX from 'xlsx';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { getDataFilePath } from './data-path';

const DB_PATH = getDataFilePath('transactions.xlsx');

export interface Transaction {
  id: string;
  items: Array<{
    stockId: string;
    namaBarang: string;
    quantity: number;
    hargaJual: number;
    subtotal: number;
  }>;
  total: number;
  metodePembayaran: 'cash' | 'transfer' | 'qris' | 'debit' | 'kredit';
  kasir?: string; // Username kasir yang melakukan transaksi
  invoicePath?: string; // Path ke file invoice
  cancelledAt?: string; // Untuk soft delete/cancel
  createdAt: string;
}

function initializeExcel(): void {
  try {
    // Ensure data directory exists (getDataDir handles this)
    getDataFilePath('transactions.xlsx'); // This will ensure directory exists

    if (!existsSync(DB_PATH)) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet<Transaction>([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
    }
  } catch (error) {
    console.error('Error initializing Transaction Excel:', error);
    throw new Error('Gagal menginisialisasi database transaksi');
  }
}

export function writeTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      initializeExcel();

      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
      
      // Parse items from JSON string back to array
      const transactions = data.map((t) => {
        let items = t.items;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch {
            items = [];
          }
        }
        if (!Array.isArray(items)) {
          items = [];
        }
        return {
          ...t,
          items,
        } as Transaction;
      });

      const id = createId();
      const createdAt = new Date().toISOString();

      const newTransaction: Transaction = {
        ...transaction,
        id,
        createdAt,
      };

      transactions.push(newTransaction);

      // Convert items array to JSON string for Excel compatibility
      const transactionsForExcel = transactions.map(t => ({
        ...t,
        items: JSON.stringify(t.items), // Convert array to JSON string
      }));

      const newWorkbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(transactionsForExcel);
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Transactions');
      const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
      return newTransaction;
    } catch (error) {
      lastError = error as Error;
      retries--;
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {}
      }
    }
  }
  console.error('Error writing transaction after retries:', lastError);
  throw new Error('Gagal menyimpan transaksi ke database. Pastikan file Excel tidak sedang dibuka.');
}

export function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Transaction | undefined {
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      initializeExcel();

      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
      
      // Parse items from JSON string back to array
      const transactions = data.map((t) => {
        let items = t.items;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch {
            items = [];
          }
        }
        if (!Array.isArray(items)) {
          items = [];
        }
        return {
          ...t,
          items,
        } as Transaction;
      });

      const index = transactions.findIndex(t => t.id === id);
      if (index === -1) return undefined;

      transactions[index] = {
        ...transactions[index],
        ...updates,
      };

      // Convert items array to JSON string for Excel compatibility
      const transactionsForExcel = transactions.map(t => ({
        ...t,
        items: JSON.stringify(t.items),
      }));

      const newWorkbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(transactionsForExcel);
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Transactions');
      const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
      writeFileSync(DB_PATH, buffer);
      return transactions[index];
    } catch (error) {
      lastError = error as Error;
      retries--;
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {}
      }
    }
  }
  console.error('Error updating transaction after retries:', lastError);
  return undefined;
}

export function readTransactions(): Transaction[] {
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      initializeExcel();
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
      
      // Parse items from JSON string back to array
      const transactions = data.map((t) => {
        let items = t.items;
        // If items is a string, parse it
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.error('Error parsing items:', e);
            items = [];
          }
        }
        // If items is not an array, make it an array
        if (!Array.isArray(items)) {
          items = [];
        }
        return {
          ...t,
          items,
        } as Transaction;
      });
      
      // Filter out cancelled transactions
      return transactions.filter(t => !t.cancelledAt);
    } catch (error) {
      lastError = error as Error;
      retries--;
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {}
      }
    }
  }
  console.error('Error reading transactions after retries:', lastError);
  return [];
}

export function findTransactionById(id: string): Transaction | undefined {
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      initializeExcel();
      const fileBuffer = readFileSync(DB_PATH);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Transaction>(worksheet);
      return data.find(t => t.id === id && !t.cancelledAt);
    } catch (error) {
      lastError = error as Error;
      retries--;
      if (retries > 0) {
        const waitTime = (4 - retries) * 100;
        const start = Date.now();
        while (Date.now() - start < waitTime) {}
      }
    }
  }
  console.error('Error finding transaction after retries:', lastError);
  return undefined;
}
