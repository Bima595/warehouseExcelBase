'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Smartphone, Building2, Banknote, CheckCircle2, Eye, Download, Printer, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
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
import type { CheckoutItem } from '@/types/transaction';
import InvoicePreview from './InvoicePreview';
import confetti from 'canvas-confetti';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CheckoutItem[];
  total: number;
  onSuccess: () => void;
}

export default function CheckoutDialog({
  open,
  onOpenChange,
  items,
  total,
  onSuccess,
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [storeQrisUrl, setStoreQrisUrl] = useState<string | null>(null);
  const [invoicePath, setInvoicePath] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState<number | ''>('');

  // Fetch store QRIS on mount or when dialog opens
  useEffect(() => {
    if (open) {
      import('@/app/actions/settings').then(mod => {
        mod.getStoreQrisAction().then(res => {
          if (res.success && res.url) {
            setStoreQrisUrl(res.url);
          }
        });
      });
    }
  }, [open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ukuran gambar maksimal 5MB' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10' },
    { value: 'transfer', label: 'Transfer', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { value: 'qris', label: 'QRIS', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { value: 'debit', label: 'Debit', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { value: 'kredit', label: 'Kredit', icon: Building2, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ] as const;

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
      const result = await checkoutAction(
        items,
        selectedPayment as 'cash' | 'transfer' | 'qris' | 'debit' | 'kredit',
        proofImage
      );

      if (result.success) {
        setPaymentSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        onSuccess();
        toast({
          title: 'Pembayaran Diterima',
          description: 'Transaksi telah berhasil diproses ke dalam sistem.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan saat checkout',
        });
      }
    } catch (error: unknown) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan sistem',
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
        
        {/* Image Preview Overlay */}
        <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
          <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex flex-col items-center justify-center gap-4 focus:outline-none" onClick={() => setViewImage(null)}>
            <DialogTitle className="sr-only">Image Preview</DialogTitle>
            <div className="relative w-full h-[80vh] flex items-center justify-center pointer-events-none">
              {viewImage && (
                <Image 
                  src={viewImage} 
                  alt="Preview" 
                  fill 
                  className="object-contain pointer-events-auto"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <AnimatePresence mode="wait">
          {!paymentSuccess ? (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-full max-h-[90vh]"
            >
              <DialogHeader className="px-6 py-6 sm:px-10 sm:pt-10 sm:pb-6 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                   </div>
                   <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight uppercase">Checkout Terminal</DialogTitle>
                </div>
                <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  Konfirmasi pembayaran dan pilih metode yang tersedia
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-6 custom-scrollbar">
                <div className="space-y-6 sm:space-y-10">
                  {/* Visual Amount Display */}
                  <div className="relative group overflow-hidden bg-slate-900 dark:bg-slate-100 p-6 sm:p-8 rounded-[2rem] text-white dark:text-slate-950 shadow-2xl shrink-0">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                       <CreditCard size={120} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Total Transaksi</p>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">
                      Rp{total.toLocaleString('id-ID')}
                    </h2>
                  </div>

                  {/* Modern Payment Selector */}
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pilih Metode Pembayaran</Label>
                    <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedPayment === method.value;
                        return (
                          <div key={method.value}>
                            <RadioGroupItem value={method.value} id={method.value} className="sr-only" />
                            <Label
                              htmlFor={method.value}
                              className={`flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer h-24 sm:h-32 gap-2 sm:gap-3 ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 shadow-[0_20px_40px_-10px_rgba(var(--primary),0.2)]' 
                                  : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              <div className={`p-2 sm:p-3 rounded-2xl ${isSelected ? 'bg-primary/20 scale-110' : method.bg} transition-transform`}>
                                <Icon className={`h-5 w-5 sm:h-7 sm:w-7 ${isSelected ? 'text-primary' : method.color}`} />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                                {method.label}
                              </span>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                    
                    {selectedPayment === 'cash' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-2"
                      >
                         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                           <div className="space-y-2">
                             <Label htmlFor="cash-amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nominal Uang</Label>
                             <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                               <input
                                 type="text"
                                 id="cash-amount"
                                 value={cashAmount ? parseInt(cashAmount.toString()).toLocaleString('id-ID') : ''}
                                 onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setCashAmount(value ? parseInt(value) : '');
                                 }}
                                 className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-950 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-primary outline-none font-black text-xl transition-all"
                                 placeholder="0"
                               />
                             </div>
                           </div>
                           
                           <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                              <span className="text-xs font-bold text-slate-500">Kembalian</span>
                              <span className={`text-xl font-black ${(cashAmount && (typeof cashAmount === 'number' ? cashAmount : 0) >= total) ? 'text-green-500' : 'text-slate-300'}`}>
                                Rp {Math.max(0, (typeof cashAmount === 'number' ? cashAmount : 0) - total).toLocaleString('id-ID')}
                              </span>
                           </div>
                         </div>
                      </motion.div>
                    )}

                    {selectedPayment === 'qris' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-2"
                      >
                         {/* Store QRIS Display */}
                         {storeQrisUrl && (
                           <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Scan QRIS Ini</Label>
                             <div 
                               className="relative w-32 h-32 sm:w-48 sm:h-48 cursor-zoom-in active:scale-95 transition-transform"
                               onClick={() => setViewImage(storeQrisUrl)}
                             >
                                <Image src={storeQrisUrl} fill alt="Store QRIS" className="object-contain rounded-lg" />
                             </div>
                             <p className="text-xs text-slate-500 mt-2 text-center">Klik gambar untuk memperbesar</p>
                           </div>
                         )}

                         <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bukti Pembayaran QRIS</Label>
                         <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-primary/50 transition-colors">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              id="qris-upload"
                              onChange={handleImageUpload}
                            />
                            <div className="flex items-center gap-4 w-full">
                               {proofImage ? (
                                 <div className="flex items-center gap-4 w-full">
                                    <div 
                                      className="relative h-12 w-12 sm:h-16 sm:w-16 cursor-zoom-in"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setViewImage(proofImage);
                                      }}
                                    >
                                      <Image src={proofImage} fill alt="Bukti" className="object-cover rounded-xl" />
                                    </div>
                                    <Label htmlFor="qris-upload" className="flex-1 cursor-pointer">
                                       <p className="text-sm font-bold text-slate-800 dark:text-white">Bukti Terupload</p>
                                       <p className="text-xs text-slate-500">Klik untuk ganti</p>
                                    </Label>
                                    <CheckCircle2 className="text-green-500 h-6 w-6" />
                                 </div>
                               ) : (
                                 <Label htmlFor="qris-upload" className="cursor-pointer flex flex-col items-center justify-center w-full py-4 text-slate-400">
                                    <Download className="h-8 w-8 mb-2 opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-center">Upload Bukti Transfer</span>
                                 </Label>
                               )}
                            </div>
                         </div>
                       </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 pt-4 shrink-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-t border-slate-100 dark:border-slate-900">
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 sm:h-16 px-4 sm:px-8 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">
                    <ArrowLeft className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Kembali</span>
                  </Button>
                  <Button 
                    onClick={handlePayment} 
                    disabled={loading || !selectedPayment || (selectedPayment === 'cash' && (!cashAmount || (typeof cashAmount === 'number' ? cashAmount : 0) < total))} 
                    className="flex-1 h-12 sm:h-16 rounded-2xl sm:rounded-3xl font-black text-sm sm:text-lg bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Memproses...' : (
                      <span className="flex items-center gap-2">
                        Konfirmasi <span className="hidden sm:inline">Pembayaran</span> <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
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

interface ActionBtnProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function ActionBtn({ icon: Icon, label, onClick }: ActionBtnProps) {
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
