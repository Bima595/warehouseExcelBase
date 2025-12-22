'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ukuran gambar maksimal 5MB',
      });
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'File harus berupa gambar',
      });
      return;
    }

    // Compress image di client side sebelum convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Create canvas untuk resize
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
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

        // Draw dan compress
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to base64 dengan quality 0.8
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
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
      
      if (imageBase64) {
        formDataObj.append('gambar', imageBase64);
      }
      
      if (stock) {
        formDataObj.append('id', stock.id);
        formDataObj.append('keepImage', imageBase64 ? 'false' : 'true');
      }

      const result = stock
        ? await updateStockAction(formDataObj)
        : await createStockAction(formDataObj);

      if (result.success) {
        toast({
          variant: 'success',
          title: 'Berhasil',
          description: stock ? 'Stock berhasil diupdate' : 'Stock berhasil dibuat',
        });
        onSuccess();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Terjadi kesalahan',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan stock',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 shadow-xl bg-background mx-auto">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div>
          <CardTitle className="text-2xl">{stock ? 'Edit Stock' : 'Tambah Stock Baru'}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {stock ? 'Ubah informasi stock yang ada' : 'Tambahkan item stock baru ke inventory'}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="namaBarang" className="text-sm font-medium">
                Nama Barang
              </label>
              <Input
                id="namaBarang"
                value={formData.namaBarang}
                onChange={(e) =>
                  setFormData({ ...formData, namaBarang: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="stock" className="text-sm font-medium">
                  Stock
                </label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hargaBeli" className="text-sm font-medium">
                  Harga Beli
                </label>
                <Input
                  id="hargaBeli"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hargaBeli}
                  onChange={(e) =>
                    setFormData({ ...formData, hargaBeli: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="hargaJual" className="text-sm font-medium">
                Harga Jual
              </label>
              <Input
                id="hargaJual"
                type="number"
                min="0"
                step="0.01"
                value={formData.hargaJual}
                onChange={(e) =>
                  setFormData({ ...formData, hargaJual: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gambar</label>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        setImageBase64('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Klik untuk upload gambar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max 5MB, format: JPG, PNG
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Ganti Gambar
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : stock ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}

