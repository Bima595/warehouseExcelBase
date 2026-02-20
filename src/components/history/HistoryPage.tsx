'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, Printer, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getTransactionsAction, cancelTransactionAction } from '@/app/actions/transaction';
import type { Transaction } from '@/lib/transaction-db';
import InvoicePreview from '@/components/cashier/InvoicePreview';
import DeleteConfirmDialog from '@/components/stock/DeleteConfirmDialog';

export default function HistoryPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTransactionsAction();
      if (result.success && result.transactions) {
        setTransactions(result.transactions);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Gagal memuat data transaksi',
        });
      }
    } catch (error) {
       console.error(error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data transaksi',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handlePreview = (invoicePath: string) => {
    setSelectedInvoice(invoicePath);
    setPreviewOpen(true);
  };

  const handleDownload = (invoicePath: string) => {
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
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Gagal mengunduh invoice',
          });
        });
    }
  };

  const handlePrint = (invoicePath: string) => {
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
           console.error(error);
           toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Gagal mencetak invoice',
          });
        });
    }
  };

  const handleCancel = (transactionId: string) => {
    setTransactionToCancel(transactionId);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!transactionToCancel) return;

    try {
      const result = await cancelTransactionAction(transactionToCancel);
      if (result.success) {
        toast({
          variant: 'success',
          title: 'Berhasil',
          description: 'Transaksi berhasil dibatalkan dan stock dikembalikan',
        });
        loadTransactions();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Gagal membatalkan transaksi',
        });
      }
    } catch (error) {
       console.error(error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat membatalkan transaksi',
      });
    } finally {
      setCancelDialogOpen(false);
      setTransactionToCancel(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    transfer: 'Transfer',
    qris: 'QRIS',
    debit: 'Kartu Debit',
    kredit: 'Kartu Kredit',
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">History Transaksi</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Daftar semua transaksi yang telah dilakukan
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Calendar className="h-16 w-16 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">Belum ada transaksi</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Transaksi akan muncul di sini setelah checkout
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const invoiceNumber = `INV-${transaction.id.slice(0, 8).toUpperCase()}`;
            return (
              <Card key={transaction.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">
                        {invoiceNumber}
                      </CardTitle>
                      <div className="mt-2 space-y-1 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                        {transaction.kasir && (
                          <div>
                            <span className="font-medium">Kasir:</span> {transaction.kasir}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Metode:</span>{' '}
                          {paymentMethodLabels[transaction.metodePembayaran] || transaction.metodePembayaran}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-bold text-primary">
                        Rp {transaction.total?.toLocaleString('id-ID') || '0'}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {transaction.items && Array.isArray(transaction.items) 
                          ? `${transaction.items.length} ${transaction.items.length === 1 ? 'item' : 'items'}`
                          : '0 items'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="border-t pt-3">
                      <div className="space-y-2">
                        {transaction.items && Array.isArray(transaction.items) && transaction.items.length > 0 ? (
                          transaction.items.map((item: { namaBarang: string; quantity: number; hargaJual: number; subtotal: number }, index: number) => (
                            <div
                              key={`${transaction.id}-item-${index}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item?.namaBarang || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item?.quantity || 0} x Rp {(item?.hargaJual || 0).toLocaleString('id-ID')}
                                </p>
                              </div>
                              <p className="text-sm font-semibold ml-4">
                                Rp {(item?.subtotal || 0).toLocaleString('id-ID')}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Tidak ada item
                          </p>
                        )}
                      </div>
                    </div>

                    {transaction.invoicePath && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(transaction.invoicePath!)}
                          className="gap-2 text-xs sm:text-sm"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Lihat</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(transaction.invoicePath!)}
                          className="gap-2 text-xs sm:text-sm"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(transaction.invoicePath!)}
                          className="gap-2 text-xs sm:text-sm"
                        >
                          <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Print</span>
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(transaction.id)}
                          className="gap-2 text-xs sm:text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 sm:h-4 sm:w-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          <span className="hidden sm:inline font-medium">Batalkan</span>
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <InvoicePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoicePath={selectedInvoice}
      />

      <DeleteConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={confirmCancel}
        title="Batalkan Transaksi"
        description="Apakah Anda yakin ingin membatalkan transaksi ini? Stock akan dikembalikan ke inventory."
      />
    </div>
  );
}

