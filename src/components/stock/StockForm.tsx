'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createStockAction, updateStockAction } from '@/app/actions/stock';
import type { StockWithoutDeleted } from '@/lib/stock-db';

interface StockFormProps {
  stock?: StockWithoutDeleted | null;
  onClose?: () => void;
  onSuccess: () => void;
}

export default function StockForm({ stock, onClose, onSuccess }: StockFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Helper untuk format angka (1000 -> 1.000)
  const formatNumber = (num: number | string): string => {
    if (num === '' || num === undefined || num === null) return '';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  };

  // Helper untuk parse angka (1.000 -> 1000)
  const parseNumber = (str: string): number | '' => {
    if (typeof str !== 'string') return str;
    const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
    if (cleanStr === '') return '';
    const num = parseFloat(cleanStr);
    return isNaN(num) ? '' : num;
  };

  const [formData, setFormData] = useState({
    namaBarang: stock?.namaBarang || '',
    stock: stock?.stock ? formatNumber(stock.stock) : '',
    hargaBeli: stock?.hargaBeli ? formatNumber(stock.hargaBeli) : '',
    hargaJual: stock?.hargaJual ? formatNumber(stock.hargaJual) : '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(
    stock?.gambar ? stock.gambar : null
  );
  const [imageBase64, setImageBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for cursor management
  const cursorState = useRef<{ field: string; position: number | null }>({ field: '', position: null });

  // Restore cursor position after render
  useEffect(() => {
    if (cursorState.current.field && cursorState.current.position !== null) {
      const input = document.querySelector(`input[name="${cursorState.current.field}"]`) as HTMLInputElement;
      if (input) {
        input.setSelectionRange(cursorState.current.position, cursorState.current.position);
      }
      cursorState.current = { field: '', position: null };
    }
  }, [formData]);

  const handleNumberChange = (field: keyof typeof formData, value: string, e: React.ChangeEvent<HTMLInputElement>) => {
    // Current cursor position
    const selectionStart = e.target.selectionStart || 0;
    
    // Count digits before cursor in the NEW value (raw input before formatting)
    // Actually, we need to track how many digits were before the cursor in the input value
    // But since we are formatting immediately, we need to map the "raw digit index" to "formatted index"
    
    // Simplest robust way: 
    // 1. Get raw value (digits only).
    // 2. Format it.
    // 3. Calculate where the cursor should be based on the *digits* before appropriate index.
    
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    const num = parseNumber(cleanValue);
    const formatted = formatNumber(num);
    
    if (formatted === formData[field]) return; // No change

    // Calculate new cursor position
    // Count digits to the left of the original cursor in the *input value* (which includes user's new char)
    const valueBeforeCursor = value.slice(0, selectionStart);
    const digitsBeforeCursor = valueBeforeCursor.replace(/[^0-9]/g, '').length;
    
    // Find index in 'formatted' that has 'digitsBeforeCursor' digits before it
    let digitsSeen = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) {
            digitsSeen++;
        }
        if (digitsSeen >= digitsBeforeCursor && /[0-9]/.test(formatted[i])) {
             break;
        } else if (digitsSeen === digitsBeforeCursor && !/[0-9]/.test(formatted[i])) {
            // Case where we are at the target digit count but next char is not a digit (e.g. dot)
            // We usually want to include the dot if we just typed past it? 
            // Stick to simple: after the Nth digit.
        }
    }
    
    // Edge case: if we deleted a digit, we might need to adjust.
    // But normally, "after N digits" works for addition.
    // For deletion (backspace), selectionStart moves back.
    
    // Let's rely on digits count.
    let pos = 0;
    let count = 0;
    while (pos < formatted.length && count < digitsBeforeCursor) {
        if (/[0-9]/.test(formatted[pos])) {
            count++;
        }
        pos++;
    }
    // If the next char is a dot, move past it? 
    // Usually standard behavior is to stay after the digit.
    
    cursorState.current = { field: field as string, position: pos };
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ukuran gambar maksimal 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setImageBase64(compressedBase64);
          setImagePreview(compressedBase64);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('namaBarang', formData.namaBarang);
      formDataObj.append('stock', (parseNumber(formData.stock) || 0).toString());
      formDataObj.append('hargaBeli', (parseNumber(formData.hargaBeli) || 0).toString());
      formDataObj.append('hargaJual', (parseNumber(formData.hargaJual) || 0).toString());
      
      if (imageBase64) formDataObj.append('gambar', imageBase64);
      if (stock) {
        formDataObj.append('id', stock.id);
        formDataObj.append('keepImage', imageBase64 ? 'false' : 'true');
      }

      const result = stock
        ? await updateStockAction(formDataObj)
        : await createStockAction(formDataObj);

      if (result.success) {
        toast({ title: 'Success', description: stock ? 'Item updated' : 'Item created' });
        onSuccess();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Internal error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-white dark:bg-slate-950 border-none shadow-2xl rounded-[3rem] overflow-hidden">
      <div className="p-8 sm:p-12">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {stock ? 'Edit' : 'New'} <span className="text-primary">Stock</span>
            </h2>
            <p className="text-slate-500 font-medium">Lengkapi detail inventory barang.</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-900">
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Barang</label>
              <Input
                value={formData.namaBarang}
                onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Ex: Mie Sedap Goreng"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qty Stock</label>
                <Input
                  type="text"
                  name="stock"
                  inputMode="numeric"
                  value={formData.stock}
                  onChange={(e) => handleNumberChange('stock', e.target.value, e)}
                  className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 font-bold"
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Harga Beli</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                    <span className="text-slate-500 font-bold text-sm">Rp</span>
                  </div>
                  <Input
                    type="text"
                    name="hargaBeli"
                    inputMode="numeric"
                    value={formData.hargaBeli}
                    onChange={(e) => handleNumberChange('hargaBeli', e.target.value, e)}
                    className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-14 pr-6 font-bold"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Harga Jual</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                    <span className="text-slate-500 font-bold text-sm">Rp</span>
                  </div>
                  <Input
                    type="text"
                    name="hargaJual"
                    inputMode="numeric"
                    value={formData.hargaJual}
                    onChange={(e) => handleNumberChange('hargaJual', e.target.value, e)}
                    className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-14 pr-6 font-bold focus:ring-4 focus:ring-primary/10"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thumbnail Produk</label>
              <div 
                onClick={() => !imagePreview && fileInputRef.current?.click()}
                className={`relative h-56 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                  imagePreview 
                    ? 'border-transparent' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5'
                }`}
              >
                {imagePreview ? (
                  <>
                    <NextImage src={imagePreview} fill className="object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl border-white text-white hover:bg-white hover:text-black">
                        Change
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => { setImagePreview(null); setImageBase64(''); }} className="rounded-xl">
                        Delete
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl inline-block mb-3">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tap to upload</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <Button type="button" variant="ghost" onClick={onClose} className="h-16 flex-1 rounded-2xl font-bold">
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-16 flex-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all font-black text-xl shadow-2xl shadow-slate-900/20"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-6 w-6" />
                  <span>{stock ? 'Update' : 'Simpan'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
