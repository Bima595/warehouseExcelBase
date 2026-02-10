import { supabase } from './supabase';

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

export type StockWithoutDeleted = Omit<Stock, 'deletedAt'>;

// Baca semua stock dari Supabase (tanpa yang di-delete)
export async function readStocks(): Promise<StockWithoutDeleted[]> {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error reading stocks:', error);
      return [];
    }

    return (data || []).map((stock) => ({
      id: stock.id,
      namaBarang: stock.nama_barang || '',
      stock: stock.stock || 0,
      hargaBeli: stock.harga_beli || 0,
      hargaJual: stock.harga_jual || 0,
      gambar: stock.gambar || undefined,
      qrCode: stock.qr_code || undefined,
      createdAt: stock.created_at || new Date().toISOString(),
      updatedAt: stock.updated_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error reading stocks:', error);
    return [];
  }
}

// Baca semua stock termasuk yang di-delete (untuk admin)
export async function readAllStocks(): Promise<Stock[]> {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error reading all stocks:', error);
      return [];
    }

    return (data || []).map((stock) => ({
      id: stock.id,
      namaBarang: stock.nama_barang || '',
      stock: stock.stock || 0,
      hargaBeli: stock.harga_beli || 0,
      hargaJual: stock.harga_jual || 0,
      gambar: stock.gambar || undefined,
      qrCode: stock.qr_code || undefined,
      deletedAt: stock.deleted_at || undefined,
      createdAt: stock.created_at || new Date().toISOString(),
      updatedAt: stock.updated_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error reading all stocks:', error);
    return [];
  }
}

// Tulis stock baru ke Supabase
export async function writeStock(stock: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stock> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('stocks')
      .insert({
        nama_barang: stock.namaBarang,
        stock: stock.stock,
        harga_beli: stock.hargaBeli,
        harga_jual: stock.hargaJual,
        gambar: stock.gambar || null,
        qr_code: stock.qrCode || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error writing stock:', error);
      throw new Error(`Gagal menyimpan stock ke database: ${error.message}`);
    }

    if (!data) {
      throw new Error('Gagal menyimpan stock ke database: tidak ada data yang dikembalikan');
    }

    return {
      id: data.id,
      namaBarang: data.nama_barang || '',
      stock: data.stock || 0,
      hargaBeli: data.harga_beli || 0,
      hargaJual: data.harga_jual || 0,
      gambar: data.gambar || undefined,
      qrCode: data.qr_code || undefined,
      createdAt: data.created_at || now,
      updatedAt: data.updated_at || now,
    };
  } catch (error) {
    console.error('Error writing stock:', error);
    throw error instanceof Error ? error : new Error('Gagal menyimpan stock ke database');
  }
}

// Update stock
export async function updateStock(id: string, updates: Partial<Omit<Stock, 'id' | 'createdAt'>>): Promise<Stock> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.namaBarang !== undefined) updateData.nama_barang = updates.namaBarang;
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.hargaBeli !== undefined) updateData.harga_beli = updates.hargaBeli;
    if (updates.hargaJual !== undefined) updateData.harga_jual = updates.hargaJual;
    if (updates.gambar !== undefined) updateData.gambar = updates.gambar || null;
    if (updates.qrCode !== undefined) updateData.qr_code = updates.qrCode || null;
    if (updates.deletedAt !== undefined) updateData.deleted_at = updates.deletedAt || null;

    const { data, error } = await supabase
      .from('stocks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating stock:', error);
      throw new Error(`Gagal mengupdate stock: ${error.message}`);
    }

    if (!data) {
      throw new Error('Stock tidak ditemukan');
    }

    return {
      id: data.id,
      namaBarang: data.nama_barang || '',
      stock: data.stock || 0,
      hargaBeli: data.harga_beli || 0,
      hargaJual: data.harga_jual || 0,
      gambar: data.gambar || undefined,
      qrCode: data.qr_code || undefined,
      deletedAt: data.deleted_at || undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error instanceof Error ? error : new Error('Gagal mengupdate stock');
  }
}

// Soft delete stock
export async function deleteStock(id: string): Promise<void> {
  await updateStock(id, { deletedAt: new Date().toISOString() });
}

// Cari stock berdasarkan ID
export async function findStockById(id: string): Promise<Stock | undefined> {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      namaBarang: data.nama_barang || '',
      stock: data.stock || 0,
      hargaBeli: data.harga_beli || 0,
      hargaJual: data.harga_jual || 0,
      gambar: data.gambar || undefined,
      qrCode: data.qr_code || undefined,
      deletedAt: data.deleted_at || undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error finding stock by id:', error);
    return undefined;
  }
}

