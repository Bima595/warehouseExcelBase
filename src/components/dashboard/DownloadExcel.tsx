'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { downloadExcelFile } from '@/app/actions/download';

export default function DownloadExcel() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (filename: 'users.xlsx' | 'stock.xlsx' | 'transactions.xlsx') => {
    setDownloading(filename);
    try {
      const result = await downloadExcelFile(filename);
      
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        return;
      }

      if (result.success && result.data) {
        // Convert base64 to blob
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { 
          type: result.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          variant: 'success',
          title: 'Berhasil',
          description: `File ${filename} berhasil diunduh`,
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengunduh file',
      });
    } finally {
      setDownloading(null);
    }
  };

  const files = [
    { name: 'users.xlsx', label: 'Data Users', description: 'Download semua data pengguna' },
    { name: 'stock.xlsx', label: 'Data Stock', description: 'Download semua data stock barang' },
    { name: 'transactions.xlsx', label: 'Data Transaksi', description: 'Download semua data transaksi' },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Download Data Excel
        </CardTitle>
        <CardDescription>
          Unduh file Excel untuk backup atau analisis data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
          {files.map((file) => (
            <Button
              key={file.name}
              variant="outline"
              className="flex flex-col items-start h-auto p-4 gap-2"
              onClick={() => handleDownload(file.name as 'users.xlsx' | 'stock.xlsx' | 'transactions.xlsx')}
              disabled={downloading === file.name}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-semibold">{file.label}</span>
                </div>
                {downloading === file.name ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </div>
              <p className="text-xs text-muted-foreground text-left w-full">
                {file.description}
              </p>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


