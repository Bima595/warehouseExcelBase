'use server';

import { getSetting, saveSetting } from '@/lib/settings-db';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function uploadStoreQrisAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file uploaded' };
    }

    const { data, error } = await supabase.storage
      .from('stock-images') // Reuse existing bucket
      .upload(`store-qris-${Date.now()}.jpg`, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error('Error uploading QRIS:', error);
      return { error: 'Gagal upload gambar' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('stock-images')
      .getPublicUrl(data.path);

    // Save to settings
    const saved = await saveSetting('store_qris_image', publicUrl);
    if (!saved) {
      return { error: 'Gagal menyimpan setting' };
    }

    revalidatePath('/settings');
    revalidatePath('/cashier');

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error in uploadStoreQrisAction:', error);
    return { error: 'Terjadi kesalahan sistem' };
  }
}

export async function getStoreQrisAction() {
  try {
    const url = await getSetting('store_qris_image');
    return { success: true, url };
  } catch (error) {
    console.error('Error fetching QRIS:', error);
    return { error: 'Gagal mengambil data' };
  }
}
