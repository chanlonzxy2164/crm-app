"use client";
import { UserCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ProfileSettingsPage() {
  const { data: session } = useSession();

  return (
    <section className="glass-panel" style={{ padding: '32px', maxWidth: '600px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <UserCircle size={24} color="var(--primary)" /> あなたのプロフィール
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>名前</label>
          <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{session?.user?.name}</p>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>メールアドレス</label>
          <p style={{ fontSize: '16px' }}>{session?.user?.email}</p>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>所属企業</label>
          <p style={{ fontSize: '16px' }}>{session?.user?.companyName || '未設定'}</p>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>権限</label>
          <span className="badge badge-active">{session?.user?.role === 'ADMIN' ? '管理者' : 'メンバー'}</span>
        </div>
      </div>
    </section>
  );
}
