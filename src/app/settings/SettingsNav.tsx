"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsNav({ role }: { role: string }) {
  const pathname = usePathname();
  
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
      <Link href="/settings" style={{ 
        padding: '12px 24px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold',
        color: pathname === '/settings' ? 'var(--primary)' : 'var(--text-muted)',
        borderBottom: pathname === '/settings' ? '2px solid var(--primary)' : '2px solid transparent'
      }}>
        プロフィール設定
      </Link>
      {role === 'ADMIN' && (
        <Link href="/settings/team" style={{ 
          padding: '12px 24px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold',
          color: pathname.startsWith('/settings/team') ? 'var(--primary)' : 'var(--text-muted)',
          borderBottom: pathname.startsWith('/settings/team') ? '2px solid var(--primary)' : '2px solid transparent'
        }}>
          チーム・ユーザー管理
        </Link>
      )}
    </div>
  );
}
