import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { findStockById } from "@/lib/stock-db";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  const { id } = await params;
  const stock = findStockById(id);

  if (!stock || stock.deletedAt) {
    redirect('/stock');
  }

  // Redirect ke cashier dengan query param untuk auto-add
  redirect(`/cashier?add=${id}`);
}

