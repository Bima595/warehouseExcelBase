'use client';

import { useState } from 'react';
import { CreditCard, Wallet, Smartphone, Building2, Banknote, CheckCircle2, Eye, Download, Printer, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { checkoutAction } from '@/app/actions/transaction';
import { useRouter } from 'next/navigation';
import InvoicePreview from './InvoicePreview';
import type { CartItem } from '@/hooks/use-cart';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  total: number;
  onSuccess: () => void;
}

const paymentMethods = [
  { value: 'cash', label: 'Tunai', icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10' },
  { value: 'transfer', label: 'Transfer', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'qris', label: 'QRIS', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { value: 'debit', label: 'Debit', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { value: 'kredit', label: 'Kredit', icon: Wallet, color: 'text-red-500', bg: 'bg-red-500/10' },
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
        title: 'Metode Pembayaran',
        description: 'Silakan pilih metode pembayaran untuk melanjutkan.',
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
        selectedPayment as any
      );

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Transaksi Gagal',
          description: result.error,
        });
      } else {
        setPaymentSuccess(true);
        setInvoicePath(result.transaction?.invoicePath || null);
        toast({
          title: 'Pembayaran Diterima',
          description: 'Transaksi telah berhasil diproses ke dalam sistem.',
        });
        router.refresh();
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'System Error',
        description: 'Terjadi kegagalan saat menghubungi server pembayaran.',
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

  const handleAction = async (action: 'preview' | 'download' | 'print') => {
    if (!invoicePath) return;

    if (action === 'preview') {
      setPreviewOpen(true);
      return;
    }

    try {
      const response = await fetch(invoicePath);
      const html = await response.text();

      if (action === 'download') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (action === 'print') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.opacity = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }, 250);
        }
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      toast({ variant: 'destructive', title: 'Error', description: `Gagal ${action} invoice` });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none bg-white dark:bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] outline-none">
        <AnimatePresence mode="wait">
          {!paymentSuccess ? (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col"
            >
              <DialogHeader className="p-10 pb-6">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                   </div>
                   <DialogTitle className="text-2xl font-black tracking-tight uppercase">Checkout Terminal</DialogTitle>
                </div>
                <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  Konfirmasi pembayaran dan pilih metode yang tersedia
                </DialogDescription>
              </DialogHeader>

              <div className="px-10 pb-10 space-y-10">
                {/* Visual Amount Display */}
                <div className="relative group overflow-hidden bg-slate-900 dark:bg-slate-100 p-8 rounded-[2rem] text-white dark:text-slate-950 shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                     <CreditCard size={120} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Total Transaksi</p>
                  <h2 className="text-5xl font-black tracking-tighter">
                    Rp{total.toLocaleString('id-ID')}
                  </h2>
                </div>

                {/* Modern Payment Selector */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pilih Metode Pembayaran</Label>
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPayment === method.value;
                      return (
                        <div key={method.value}>
                          <RadioGroupItem value={method.value} id={method.value} className="sr-only" />
                          <Label
                            htmlFor={method.value}
                            className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all cursor-pointer h-32 gap-3 ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-[0_20px_40px_-10px_rgba(var(--primary),0.2)]' 
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            <div className={`p-3 rounded-2xl ${isSelected ? 'bg-primary/20 scale-110' : method.bg} transition-transform`}>
                              <Icon className={`h-7 w-7 ${isSelected ? 'text-primary' : method.color}`} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                              {method.label}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-16 px-8 rounded-3xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                  </Button>
                  <Button 
                    onClick={handlePayment} 
                    disabled={loading || !selectedPayment} 
                    className="flex-1 h-16 rounded-3xl font-black text-lg bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    {loading ? 'Memproses...' : (
                      <span className="flex items-center gap-2">
                        Konfirmasi Pembayaran <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col text-center"
            >
               {/* Animated Success Background */}
               <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10 -z-10" />

              <div className="p-16 space-y-8">
                <div className="flex justify-center">
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                      className="w-28 h-28 bg-green-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-500/40"
                    >
                      <CheckCircle2 className="h-14 w-14 text-white" />
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute inset-0 bg-green-500/30 rounded-[2.5rem] -z-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tight uppercase">Transaksi Berhasil</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Silakan ambil struk transaksi di bawah ini</p>
                </div>

                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Dana Diterima</p>
                  <p className="text-4xl font-black tracking-tighter text-primary">Rp{total.toLocaleString('id-ID')}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <ActionBtn icon={Eye} label="Struk" onClick={() => handleAction('preview')} />
                  <ActionBtn icon={Download} label="Unduh" onClick={() => handleAction('download')} />
                  <ActionBtn icon={Printer} label="Cetak" onClick={() => handleAction('print')} />
                </div>

                <Button onClick={() => handleClose(false)} className="w-full h-16 rounded-3xl font-black text-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-primary dark:hover:bg-primary shadow-2xl transition-all">
                  Selesai & Tutup
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <InvoicePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          invoicePath={invoicePath}
        />
      </DialogContent>
    </Dialog>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: any) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick} 
      className="rounded-[1.5rem] h-20 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
    >
      <Icon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">{label}</span>
    </Button>
  );
}
