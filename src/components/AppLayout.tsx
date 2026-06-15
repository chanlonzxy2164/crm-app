"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ページ遷移時にモバイルメニューを閉じる
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return <main className="auth-content">{children}</main>;
  }

  return (
    <div style={{ display: 'flex', minWidth: 0 }}>
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {mobileMenuOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}
      <main className="main-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <div className="page-content" style={{ minWidth: 0 }}>{children}</div>
      </main>
    </div>
  );
}
