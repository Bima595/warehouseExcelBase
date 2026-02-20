import { supabase } from './supabase';

export async function getSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      // If error is code PGRST116 (JSON object requested, multiple (or no) results returned), it means not found
      if (error.code === 'PGRST116') return null;
      console.error(`Error fetching setting ${key}:`, error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

export async function saveSetting(key: string, value: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      console.error(`Error saving setting ${key}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    return false;
  }
}
