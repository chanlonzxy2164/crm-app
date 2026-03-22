"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('ログイン中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* 背景の装飾オブジェクト */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(66, 153, 225, 0.4) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: -1 }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(72, 187, 120, 0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: -1 }}></div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: '32px', borderTop: '4px solid var(--primary)', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'white' }}>
            <User size={32} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.5px' }}>CRM Plus</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>アカウントにログインして開始</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(229, 62, 62, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px' }}>メールアドレス</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@test.com"
              style={{ padding: '14px', fontSize: '15px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px' }}>パスワード</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ padding: '14px', fontSize: '15px' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', marginTop: '16px', borderRadius: '12px' }}
          >
            {isLoading ? 'ログイン処理中...' : <><LogIn size={18} /> ログイン</>}
          </button>
        </form>

        <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)', margin: '8px 0' }}></div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          テスト用アカウント: admin@test.com / test1234
        </p>
      </div>
    </div>
  );
}
