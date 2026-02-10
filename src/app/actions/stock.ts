'use server';

import { writeStock, readStocks, updateStock, deleteStock, findStockById } from '@/lib/stock-db';
import { compressAndSaveImage, base64ToBuffer } from '@/lib/image-utils';
import { generateStockQR } from '@/lib/qr-utils';
import { revalidatePath } from 'next/cache';

export async function createStockAction(formData: FormData) {
  try {
    const namaBarang = formData.get('namaBarang') as string;
    const stock = parseInt(formData.get('stock') as string);
    const hargaBeli = parseFloat(formData.get('hargaBeli') as string);
    const hargaJual = parseFloat(formData.get('hargaJual') as string);
    const gambarBase64 = formData.get('gambar') as string;

    // Validasi
    if (!namaBarang || !stock || !hargaBeli || !hargaJual) {
      return { error: 'Semua field harus diisi' };
    }

    if (stock < 0) {
      return { error: 'Stock tidak boleh negatif' };
    }

    if (hargaBeli < 0 || hargaJual < 0) {
      return { error: 'Harga tidak boleh negatif' };
    }

    // Compress dan save image jika ada
    let gambarPath: string | undefined;
    if (gambarBase64) {
      try {
        const imageBuffer = base64ToBuffer(gambarBase64);
        gambarPath = await compressAndSaveImage(imageBuffer, 'image.jpg');
      } catch (error) {
        console.error('Error compressing image:', error);
        return { error: 'Gagal mengupload gambar' };
      }
    }

    // Simpan stock ke Supabase dulu untuk mendapatkan ID
    const newStock = await writeStock({
      namaBarang,
      stock,
      hargaBeli,
      hargaJual,
      gambar: gambarPath,
    });

    // Generate QR code dengan ID yang benar setelah stock dibuat
    let qrCodePath: string | undefined;
    try {
      qrCodePath = await generateStockQR(newStock.id);
      // Update stock dengan QR code path
      await updateStock(newStock.id, { qrCode: qrCodePath });
    } catch (error) {
      console.error('Error generating QR code:', error);
      // QR code error tidak fatal
    }

    revalidatePath('/stock');
    return { success: true, stock: newStock };
  } catch (error) {
    console.error('Create stock error:', error);
    return { error: 'Terjadi kesalahan saat membuat stock' };
  }
}

export async function updateStockAction(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const namaBarang = formData.get('namaBarang') as string;
    const stock = parseInt(formData.get('stock') as string);
    const hargaBeli = parseFloat(formData.get('hargaBeli') as string);
    const hargaJual = parseFloat(formData.get('hargaJual') as string);
    const gambarBase64 = formData.get('gambar') as string;
    const keepImage = formData.get('keepImage') === 'true';

    if (!id || !namaBarang || !stock || !hargaBeli || !hargaJual) {
      return { error: 'Semua field harus diisi' };
    }

    const existingStock = await findStockById(id);
    if (!existingStock) {
      return { error: 'Stock tidak ditemukan' };
    }

    // Compress dan save image jika ada gambar baru
    let gambarPath = existingStock.gambar;
    if (gambarBase64 && !keepImage) {
      try {
        const imageBuffer = base64ToBuffer(gambarBase64);
        gambarPath = await compressAndSaveImage(imageBuffer, 'image.jpg');
      } catch (error) {
        console.error('Error compressing image:', error);
        return { error: 'Gagal mengupload gambar' };
      }
    }

    const updatedStock = await updateStock(id, {
      namaBarang,
      stock,
      hargaBeli,
      hargaJual,
      gambar: gambarPath,
    });

    revalidatePath('/stock');
    return { success: true, stock: updatedStock };
  } catch (error) {
    console.error('Update stock error:', error);
    return { error: 'Terjadi kesalahan saat mengupdate stock' };
  }
}

export async function deleteStockAction(id: string) {
  try {
    if (!id) {
      return { error: 'ID stock tidak valid' };
    }

    const stock = await findStockById(id);
    if (!stock) {
      return { error: 'Stock tidak ditemukan' };
    }

    await deleteStock(id);
    revalidatePath('/stock');
    return { success: true };
  } catch (error) {
    console.error('Delete stock error:', error);
    return { error: 'Terjadi kesalahan saat menghapus stock' };
  }
}

export async function getStocksAction() {
  try {
    const stocks = await readStocks();
    return { success: true, stocks };
  } catch (error) {
    console.error('Get stocks error:', error);
    return { error: 'Terjadi kesalahan saat mengambil data stock' };
  }
}

