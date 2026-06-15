"use client";
import { Search, Bell, Menu } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="glass-header glass-panel">
      <button
        type="button"
        className="mobile-menu-btn icon-btn"
        onClick={onMenuClick}
        aria-label="メニューを開く"
      >
        <Menu size={20} />
      </button>
      <form onSubmit={handleSearch} className="header-search" style={{ margin: 0 }}>
        <Search size={18} color="var(--text-muted)" onClick={handleSearch} style={{ cursor: 'pointer' }} />
        <input 
          type="text" 
          placeholder="顧客、商談を検索..." 
          className="search-input" 
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </form>
      <div className="header-actions">
        <button className="icon-btn">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
