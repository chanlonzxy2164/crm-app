"use client";
import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserEditForm({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, email: user.email, role: user.role, password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/settings/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'エラーが発生しました');
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Settings size={14} /> 権限と情報を編集
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>ユーザー情報の編集</h3>
              <X onClick={() => setIsOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">名前</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">ログインID (メールアドレス)</label>
                <input required type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">新しいパスワード (変更する場合のみ)</label>
                <input type="text" className="input-field" placeholder="変更しない場合は空欄" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>セキュリティのため以前のパスワードは表示されません。テキストを入力すると上書きされます。</span>
              </div>
              <div className="form-group">
                <label className="form-label">権限</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="MEMBER">一般メンバー (MEMBER)</option>
                  <option value="ADMIN">管理者 (ADMIN)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ background: 'transparent' }}>キャンセル</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? '保存中...' : '保存して適用'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
