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
    <div style={{ display: 'flex', minWidth: 0 }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Header />
        <div className="page-content" style={{ minWidth: 0 }}>{children}</div>
      </main>
    </div>
  );
}
