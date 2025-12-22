'use client';

import { useState } from 'react';
import { CreditCard, Wallet, Smartphone, Building2, Banknote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { checkoutAction } from '@/app/actions/transaction';
import type { CartItem } from './CashierPage';
import { useRouter } from 'next/navigation';
import { Download, Printer, Eye } from 'lucide-react';
import InvoicePreview from './InvoicePreview';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  total: number;
  onSuccess: () => void;
}

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'transfer', label: 'Transfer', icon: Building2 },
  { value: 'qris', label: 'QRIS', icon: Smartphone },
  { value: 'debit', label: 'Kartu Debit', icon: CreditCard },
  { value: 'kredit', label: 'Kartu Kredit', icon: Wallet },
] as const;

export default function CheckoutDialog({
  open,
  onOpenChange,
  cart,
  total,
  onSuccess,
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [invoicePath, setInvoicePath] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePayment = async () => {
    if (!selectedPayment) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Pilih metode pembayaran terlebih dahulu',
      });
      return;
    }

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        stockId: item.stock.id,
        quantity: item.quantity,
      }));

      const result = await checkoutAction(
        items,
        selectedPayment as 'cash' | 'transfer' | 'qris' | 'debit' | 'kredit'
      );

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        setPaymentSuccess(true);
        setInvoicePath(result.transaction?.invoicePath || null);
        toast({
          variant: 'success',
          title: 'Pembayaran Berhasil',
          description: `Transaksi berhasil dengan metode ${paymentMethods.find(m => m.value === selectedPayment)?.label}`,
        });
        router.refresh(); // Refresh untuk update stock
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat memproses pembayaran',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && paymentSuccess) {
      onSuccess();
      setPaymentSuccess(false);
      setInvoicePath(null);
      setSelectedPayment('');
    }
    onOpenChange(open);
  };

  const handlePreviewInvoice = () => {
    if (invoicePath) {
      setPreviewOpen(true);
    }
  };

  const handleDownloadInvoice = () => {
    if (invoicePath) {
      fetch(invoicePath)
        .then(response => response.text())
        .then(html => {
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${Date.now()}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({
            variant: 'success',
            title: 'Berhasil',
            description: 'Invoice berhasil diunduh',
          });
        })
        .catch(error => {
          console.error('Error downloading invoice:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Gagal mengunduh invoice',
          });
        });
    }
  };

  const handlePrintInvoice = () => {
    if (invoicePath) {
      fetch(invoicePath)
        .then(response => response.text())
        .then(html => {
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
            iframeDoc.write(html);
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
        })
        .catch(error => {
          console.error('Error printing invoice:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Gagal mencetak invoice',
          });
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{paymentSuccess ? 'Pembayaran Berhasil' : 'Checkout'}</DialogTitle>
          <DialogDescription>
            {paymentSuccess 
              ? 'Transaksi berhasil! Anda dapat mengunduh atau mencetak invoice.'
              : 'Pilih metode pembayaran untuk menyelesaikan transaksi'}
          </DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4 text-center">
              <p className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
                ✓ Pembayaran Berhasil
              </p>
              <p className="text-sm text-muted-foreground">
                Metode: {paymentMethods.find(m => m.value === selectedPayment)?.label}
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-bold mb-4">
                <span>Total</span>
                <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {invoicePath && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviewInvoice}
                  className="flex-1 gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Lihat Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintInvoice}
                  className="flex-1 gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div key={method.value}>
                        <RadioGroupItem
                          value={method.value}
                          id={method.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={method.value}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Icon className="mb-3 h-6 w-6" />
                          <span className="text-sm font-medium">{method.label}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {paymentSuccess ? (
            <Button onClick={() => handleClose(false)} className="w-full">
              Tutup
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Batal
              </Button>
              <Button onClick={handlePayment} disabled={loading || !selectedPayment}>
                {loading ? 'Memproses...' : 'Sudah Bayar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <InvoicePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoicePath={invoicePath}
      />
    </Dialog>
  );
}

