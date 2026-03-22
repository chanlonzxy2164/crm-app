"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login');

  if (isAuthPage) {
    return <main className="auth-content">{children}</main>;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1 }}>
        <Header />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
