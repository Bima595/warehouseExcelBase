'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const loadStocks = async () => {
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
  };

  useEffect(() => {
    loadStocks();
  }, []);

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
          variant: 'success',
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

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Stock Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Kelola inventory dan stok barang Anda
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Tambah Stock
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <StockForm
            stock={editingStock}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      ) : (
        <StockGrid
          stocks={stocks}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

