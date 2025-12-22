import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import StockManagement from "@/components/stock/StockManagement";

export default async function StockPage() {
  // Proteksi route
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  return (
    <div className="w-full">
      <StockManagement />
    </div>
  );
}
