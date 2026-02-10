'use client';

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Check, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  const [formData, setFormData] = useState({
    namaBarang: stock?.namaBarang || '',
    stock: stock?.stock || 0,
    hargaBeli: stock?.hargaBeli || 0,
    hargaJual: stock?.hargaJual || 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(
    stock?.gambar ? stock.gambar : null
  );
  const [imageBase64, setImageBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      formDataObj.append('stock', formData.stock.toString());
      formDataObj.append('hargaBeli', formData.hargaBeli.toString());
      formDataObj.append('hargaJual', formData.hargaJual.toString());
      
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
    } catch (error) {
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
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Harga Beli</label>
                <Input
                  type="number"
                  value={formData.hargaBeli}
                  onChange={(e) => setFormData({ ...formData, hargaBeli: parseFloat(e.target.value) || 0 })}
                  className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Harga Jual</label>
                <Input
                  type="number"
                  value={formData.hargaJual}
                  onChange={(e) => setFormData({ ...formData, hargaJual: parseFloat(e.target.value) || 0 })}
                  className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 font-bold focus:ring-4 focus:ring-primary/10"
                  required
                />
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
                    <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
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
              className="h-16 flex-[2] rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all font-black text-xl shadow-2xl shadow-slate-900/20"
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
