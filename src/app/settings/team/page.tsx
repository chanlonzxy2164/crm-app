"use client";
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Activity, Target } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'MEMBER' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsFormOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'MEMBER' });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'エラーが発生しました');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: session } = useSession();

  return (
    <div>
      {session?.user?.role !== 'ADMIN' && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
          このページは管理者権限のみアクセス可能です。
        </div>
      )}
      
      {session?.user?.role === 'ADMIN' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={16} /> 新しいメンバーを追加
        </button>
      </div>

      {isFormOpen && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>メンバー登録</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">名前</label>
              <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="山田 太郎" />
            </div>
            <div className="form-group">
              <label className="form-label">メールアドレス (ログインID)</label>
              <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="yamada@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">パスワード</label>
              <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="最低6文字〜" minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">権限ロール</label>
              <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="MEMBER">一般メンバー (MEMBER)</option>
                <option value="ADMIN">管理者 (ADMIN)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setIsFormOpen(false)} className="btn" style={{ background: 'transparent' }}>キャンセル</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? '登録中...' : '登録する'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>名前</th>
              <th>権限</th>
              <th>担当顧客</th>
              <th>活動・コンタクト</th>
              <th>成約実績</th>
              <th style={{ textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>読み込み中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>ユーザーが見つかりません。</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '15px' }}>{u.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-active' : 'badge-lead'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {u.role === 'ADMIN' && <Shield size={12} />} {u.role === 'ADMIN' ? '管理者' : 'メンバー'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{u.customerCount}名</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <Activity size={16} color="var(--primary)" /> 
                      <span style={{ fontWeight: 'bold' }}>{u.interactionCount}</span> 回の記録
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <Target size={16} color="var(--success)" />
                      <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>&yen;{u.wonAmount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a href={`/settings/team/${u.id}`} className="btn" style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--primary)', color: 'white', display: 'inline-block' }}>詳細</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
     </>
    )}
    </div>
  );
}
