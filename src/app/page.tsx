import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function Home() {
  // Proteksi route di level page
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  // Redirect ke dashboard
  redirect('/dashboard');
}
