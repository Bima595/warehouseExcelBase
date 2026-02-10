import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { findStockById } from "@/lib/stock-db";
import StockDetail from "@/components/stock/StockDetail";

export default async function StockDetailViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  const { id } = await params;
  const stock = await findStockById(id);

  if (!stock || stock.deletedAt) {
    redirect('/stock');
  }

  // Convert to plain object untuk Client Component (JSON serialization)
  const stockPlain = JSON.parse(JSON.stringify({
    id: stock.id,
    namaBarang: stock.namaBarang,
    stock: stock.stock,
    hargaBeli: stock.hargaBeli,
    hargaJual: stock.hargaJual,
    gambar: stock.gambar || undefined,
    qrCode: stock.qrCode || undefined,
    createdAt: stock.createdAt,
    updatedAt: stock.updatedAt,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <StockDetail stock={stockPlain} />
    </div>
  );
}


