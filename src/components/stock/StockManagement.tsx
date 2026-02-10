'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Package, Search, Filter, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import StockForm from './StockForm';
import StockGrid from './StockGrid';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { getStocksAction, deleteStockAction } from '@/app/actions/stock';
import type { StockWithoutDeleted } from '@/lib/stock-db';

export default function StockManagement() {
  const { toast } = useToast();
  const [stocks, setStocks] = useState<StockWithoutDeleted[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStock, setEditingStock] = useState<StockWithoutDeleted | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStocks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStocksAction();
      if (result.success && result.stocks) {
        setStocks(result.stocks);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Gagal memuat data stock',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data stock',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const handleCreate = () => {
    setEditingStock(null);
    setShowForm(true);
  };

  const handleEdit = (stock: StockWithoutDeleted) => {
    setEditingStock(stock);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setStockToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!stockToDelete) return;

    try {
      const result = await deleteStockAction(stockToDelete);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Stock berhasil dihapus',
        });
        loadStocks();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Gagal menghapus stock',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus stock',
      });
    } finally {
      setDeleteDialogOpen(false);
      setStockToDelete(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingStock(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingStock(null);
    loadStocks();
  };

  const filteredStocks = stocks.filter(s => 
    s.namaBarang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-4 sm:p-8 lg:p-12 w-full max-w-full overflow-x-hidden font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8 sm:space-y-12"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
              <Package className="h-3 w-3" />
              Inventory System
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Stock <span className="text-primary">Management</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Kelola gudang dan stok barang Anda dengan presisi.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button 
              variant="outline" 
              size="icon" 
              onClick={loadStocks}
              className="h-14 w-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={handleCreate} 
              className="h-14 px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all font-black text-lg shadow-xl shadow-slate-900/10"
            >
              <Plus className="mr-2 h-6 w-6" />
              Tambah Item
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              type="text"
              placeholder="Cari item berdasarkan nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all rounded-2xl text-base shadow-sm"
            />
          </div>
          <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold">
            <Filter className="mr-2 h-5 w-5" />
            Filter
          </Button>
        </div>

        {/* Content Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-4"
              >
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Menyelaraskan Data...</p>
              </motion.div>
            ) : filteredStocks.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 sm:p-24 text-center border border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Package className="h-12 w-12 text-slate-200 dark:text-slate-800" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Gudang Kosong</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                  Belum ada item yang terdaftar atau tidak ditemukan hasil pencarian.
                </p>
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-4 font-black text-primary">
                  Reset Pencarian
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <StockGrid
                  stocks={filteredStocks}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Form Overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl"
            >
              <StockForm
                stock={editingStock}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
