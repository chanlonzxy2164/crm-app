"use client";
import { UserCircle, Mail, CheckCircle, XCircle, ExternalLink, RefreshCw, Unlink } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [gmailStatus, setGmailStatus] = useState<any>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [gmailMessage, setGmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchGmailStatus();

    // URLパラメータからGmail接続結果を取得
    const gmailParam = searchParams.get('gmail');
    if (gmailParam === 'connected') {
      setGmailMessage({ type: 'success', text: 'Gmailアカウントが正常に接続されました！' });
      // URLパラメータをクリア
      window.history.replaceState({}, '', '/settings');
    } else if (gmailParam === 'error') {
      const reason = searchParams.get('reason') || '不明';
      setGmailMessage({ type: 'error', text: `Gmail接続に失敗しました (理由: ${reason})` });
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const fetchGmailStatus = async () => {
    try {
      const res = await fetch('/api/gmail/status');
      const data = await res.json();
      setGmailStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/gmail/auth');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setGmailMessage({ type: 'error', text: '認証URLの取得に失敗しました。Google APIの設定を確認してください。' });
        setIsConnecting(false);
      }
    } catch (err) {
      setGmailMessage({ type: 'error', text: 'エラーが発生しました' });
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Gmail連携を解除しますか？同期済みのメールデータも削除されます。')) return;
    setIsDisconnecting(true);
    try {
      await fetch('/api/gmail/status', { method: 'DELETE' });
      setGmailStatus({ connected: false });
      setGmailMessage({ type: 'success', text: 'Gmail連携を解除しました' });
    } catch (err) {
      setGmailMessage({ type: 'error', text: '解除に失敗しました' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '700px' }}>
      {/* プロフィール情報 */}
      <section className="glass-panel" style={{ padding: '32px' }}>
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

      {/* Gmail連携 */}
      <section className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={24} color="#EA4335" /> Gmail 連携
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
          Googleアカウントを連携すると、顧客とのメール送受信履歴をCRM上で確認できます。
          また、CRMから直接メールを送信することも可能です。
        </p>

        {/* ステータスメッセージ */}
        {gmailMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            background: gmailMessage.type === 'success' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)',
            border: `1px solid ${gmailMessage.type === 'success' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(245, 101, 101, 0.3)'}`,
            color: gmailMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {gmailMessage.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {gmailMessage.text}
            <button 
              onClick={() => setGmailMessage(null)} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '18px' }}
            >
              ×
            </button>
          </div>
        )}

        {isLoadingGmail ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '8px', fontSize: '14px' }}>接続状態を確認中...</p>
          </div>
        ) : gmailStatus?.connected ? (
          /* 接続済み */
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.08) 0%, rgba(72, 187, 120, 0.02) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(72, 187, 120, 0.2)',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC05 50%, #FBBC05 75%, #34A853 75%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={16} color="#EA4335" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)' }}>接続済み</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{gmailStatus.gmailEmail}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  接続日: {new Date(gmailStatus.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleConnectGmail}
                className="btn"
                disabled={isConnecting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.1)',
                  fontWeight: '600',
                }}
              >
                <RefreshCw size={16} /> 再認証する
              </button>
              <button
                onClick={handleDisconnectGmail}
                className="btn"
                disabled={isDisconnecting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: 'rgba(245, 101, 101, 0.08)',
                  border: '1px solid rgba(245, 101, 101, 0.2)',
                  color: 'var(--danger)',
                  fontWeight: '600',
                }}
              >
                <Unlink size={16} /> {isDisconnecting ? '解除中...' : '連携を解除'}
              </button>
            </div>
          </div>
        ) : (
          /* 未接続 */
          <div>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(66, 153, 225, 0.06) 0%, rgba(237, 137, 54, 0.06) 100%)',
              borderRadius: '12px',
              border: '1px dashed rgba(0,0,0,0.15)',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Mail size={28} color="var(--text-muted)" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
                Gmailアカウントが未接続です
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                接続すると顧客とのメール履歴を自動で同期し、<br />
                CRM上で一元管理できるようになります。
              </p>
            </div>

            <button
              onClick={handleConnectGmail}
              disabled={isConnecting}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '700',
                width: '100%',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #4285F4, #1a73e8)',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isConnecting ? '接続中...' : 'Googleアカウントで接続する'}
            </button>

            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>🔒 セキュリティについて</strong><br />
                アクセスは「メールの閲覧」と「メール送信」の権限のみ要求します。
                パスワードなどの情報はGoogleの安全なOAuth認証を通じて保護されています。
                いつでも連携を解除できます。
              </p>
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
