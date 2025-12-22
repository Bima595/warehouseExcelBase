'use client';

import { useEffect, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoicePath: string | null;
}

export default function InvoicePreview({
  open,
  onOpenChange,
  invoicePath,
}: InvoicePreviewProps) {
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');

  useEffect(() => {
    if (open && invoicePath) {
      fetch(invoicePath)
        .then(response => response.text())
        .then(html => {
          setInvoiceHtml(html);
        })
        .catch(error => {
          console.error('Error loading invoice:', error);
        });
    }
  }, [open, invoicePath]);

  const handlePrint = () => {
    if (invoiceHtml) {
      // Buat iframe tersembunyi untuk print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(invoiceHtml);
        iframeDoc.close();

        // Tunggu konten dimuat, lalu print
        const printHandler = () => {
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
            // Hapus iframe setelah print dialog ditutup
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 1000);
          }, 250);
        };

        if (iframe.contentWindow) {
          if (iframe.contentWindow.document.readyState === 'complete') {
            printHandler();
          } else {
            iframe.onload = printHandler;
          }
        }
      }
    }
  };

  const handleDownload = () => {
    if (invoiceHtml) {
      const blob = new Blob([invoiceHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Preview Invoice</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-start justify-center">
            {invoiceHtml ? (
              <div
                className="bg-white shadow-lg"
                style={{ 
                  width: '58mm', 
                  minWidth: '58mm',
                  maxWidth: '58mm',
                  transform: 'scale(1.5)',
                  transformOrigin: 'top center',
                }}
                dangerouslySetInnerHTML={{ __html: invoiceHtml }}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                  <p className="text-muted-foreground">Memuat invoice...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

