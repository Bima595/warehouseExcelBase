'use client';

import { useEffect, useState } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && invoicePath) {
      setLoading(true);
      fetch(invoicePath)
        .then(response => response.text())
        .then(html => {
          setInvoiceHtml(html);
        })
        .catch(error => {
          console.error('Error loading invoice:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, invoicePath]);

  const handlePrint = () => {
    if (invoiceHtml) {
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

        const printHandler = () => {
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden border-none bg-slate-50 dark:bg-slate-950 shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-black tracking-tight">Preview Invoice</DialogTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-xl font-bold">
              <Download className="h-4 w-4 mr-2" />
              HTML
            </Button>
            <Button onClick={handlePrint} className="rounded-xl font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white transition-all">
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 space-y-4"
              >
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-slate-400">Menyiapkan Preview...</p>
              </motion.div>
            ) : invoiceHtml ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-white dark:bg-white text-slate-900 shadow-xl rounded-2xl overflow-hidden border border-slate-200"
              >
                <div 
                  className="p-10 invoice-content"
                  dangerouslySetInnerHTML={{ __html: invoiceHtml }}
                />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <FileText className="h-16 w-16 mb-4 opacity-20" />
                <p className="font-bold">Tidak ada data invoice</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
