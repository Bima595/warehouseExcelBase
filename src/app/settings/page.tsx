'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { uploadStoreQrisAction, getStoreQrisAction } from '@/app/actions/settings';
import { Upload, Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getStoreQrisAction();
      if (result.success) {
        setQrisUrl(result.url || null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!newFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newFile);

      const result = await uploadStoreQrisAction(formData);
      
      if (result.success && result.url) {
        setQrisUrl(result.url);
        setNewFile(null);
        setPreview(null);
        toast({
          title: 'Berhasil',
          description: 'QRIS Toko berhasil diperbarui',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: result.error || 'Gagal menyimpan QRIS',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-white">Pengaturan Toko</h1>
      
      <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-500" />
            QRIS Toko
          </CardTitle>
          <CardDescription>
            Upload gambar QRIS statis toko Anda. Gambar ini akan muncul saat pelanggan memilih metode pembayaran QRIS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 bg-slate-50/50 dark:bg-slate-900/50">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            ) : preview || qrisUrl ? (
              <div className="relative group">
                <img 
                  src={preview || qrisUrl || ''} 
                  alt="QRIS Toko" 
                  className="max-h-64 rounded-xl shadow-lg" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <p className="text-white font-medium">Klik tombol Ganti di bawah</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Belum ada QRIS</p>
                <p className="text-sm">Upload gambar baru</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="settings-qris-upload"
              onChange={handleFileChange}
            />
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <label htmlFor="settings-qris-upload" className="cursor-pointer">
                {preview || qrisUrl ? 'Ganti Gambar' : 'Pilih Gambar'}
              </label>
            </Button>
            
            {newFile && (
              <Button 
                onClick={handleSave} 
                disabled={uploading}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
