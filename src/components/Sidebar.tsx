"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Users, Briefcase, CheckSquare, MessageSquare, BarChart3, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { name: 'ダッシュボード', path: '/', icon: LayoutDashboard },
    { name: '顧客管理', path: '/customers', icon: Users },
    { name: '商談管理', path: '/deals', icon: Briefcase },
    { name: 'タスク', path: '/tasks', icon: CheckSquare },
    { name: 'チャット', path: '/chat', icon: MessageSquare },
    { name: 'レポート', path: '/reports', icon: BarChart3 },
    { name: '設定', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="glass-nav glass-panel">
      <div style={{ padding: '0 16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>CRM Plus</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ガラスモーフィズム・デザイン</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {links.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.path || 
            (pathname?.startsWith(link.path) && link.path !== '/') || 
            (link.name === '顧客管理' && pathname?.startsWith('/client-companies'));
          
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {session?.user && (
        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{session.user.name}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{session.user.companyName || ''}</p>
          <button 
            onClick={() => signOut()} 
            className="btn" 
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)', padding: '6px' }}
          >
            <LogOut size={14} /> ログアウト
          </button>
        </div>
      )}
    </nav>
  );
}
