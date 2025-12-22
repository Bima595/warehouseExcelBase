import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import UserInfo from "@/components/auth/UserInfo";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DownloadExcel from "@/components/dashboard/DownloadExcel";

export default async function DashboardPage() {
  // Proteksi route
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="flex-shrink-0">
          <UserInfo />
        </div>
      </div>
      <div className="space-y-4 sm:space-y-6">
        <DashboardStats />
        <DownloadExcel />
      </div>
    </div>
  );
}
