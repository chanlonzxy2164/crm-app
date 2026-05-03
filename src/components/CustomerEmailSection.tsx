"use client";
import { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Inbox, ArrowUpRight, ChevronDown, ChevronUp, X, AlertCircle, Phone, Briefcase, MessageSquare, ArrowDownLeft, Edit2 } from 'lucide-react';

interface EmailMessage {
  id: string;
  subject: string | null;
  from: string;
  to: string;
  snippet: string | null;
  body: string | null;
  date: string;
  isRead: boolean;
  labelIds: string | null;
}

interface Props {
  customerId: string;
  customerEmail: string | null;
  customerName: string;
  interactions: any[];
  onEditInteraction?: (interaction: any) => void;
}

export default function CustomerEmailSection({ customerId, customerEmail, customerName, interactions, onEditInteraction }: Props) {
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ subject: '', body: '' });
  const [isSending, setIsSending] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    checkGmailAndLoad();
  }, [customerId]);

  const checkGmailAndLoad = async () => {
    try {
      const statusRes = await fetch('/api/gmail/status');
      const status = await statusRes.json();
      setGmailConnected(status.connected);
      if (status.connected) {
        await loadEmails();
      }
    } catch {
      setGmailConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmails = async () => {
    try {
      const res = await fetch(`/api/gmail/messages?customerId=${customerId}`);
      const data = await res.json();
      setEmails(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      setSyncMessage(data.message || `${data.synced}件同期`);
      await loadEmails();
    } catch {
      setSyncMessage('同期に失敗しました');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: composeData.subject,
          body: composeData.body,
          customerId,
        }),
      });
      if (res.ok) {
        setShowCompose(false);
        setComposeData({ subject: '', body: '' });
        await loadEmails();
      } else {
        const data = await res.json();
        alert(data.error || '送信に失敗しました');
      }
    } catch {
      alert('エラーが発生しました');
    } finally {
      setIsSending(false);
    }
  };

  const extractName = (emailStr: string) => {
    const match = emailStr.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].replace(/"/g, '') : emailStr.split('@')[0];
  };

  const combinedHistory = [
    ...(interactions || []).map(i => ({ ...i, isEmailRecord: false, sortDate: new Date(i.date).getTime() })),
    ...emails.map(e => ({ ...e, isEmailRecord: true, sortDate: new Date(e.date).getTime() }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  return (
    <div>
      {/* Gmailアクションエリア */}
      {isLoading ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : !gmailConnected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <AlertCircle size={20} color="var(--text-muted)" />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', flex: 1 }}>
            Gmail連携が未設定です。連携すると送受信履歴がここに統合されます。
          </p>
          <a href="/settings" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>設定画面へ</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '12px 16px', background: 'rgba(79,70,229,0.03)', borderRadius: '12px', border: '1px solid rgba(79,70,229,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={16} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>Gmail連携中</span>
            {syncMessage && <span style={{ fontSize: '12px', color: 'var(--success)', marginLeft: '8px', fontWeight: '600' }}>✓ {syncMessage}</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button onClick={handleSync} disabled={isSyncing} className="btn" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid rgba(0,0,0,0.1)' }}>
              <RefreshCw size={14} style={isSyncing ? { animation: 'spin 1s linear infinite' } : {}} /> {isSyncing ? '同期中...' : 'Gmailから同期'}
            </button>
            {customerEmail && (
              <button onClick={() => setShowCompose(!showCompose)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Send size={14} /> 新規メール
              </button>
            )}
          </div>
        </div>
      )}

      {/* メール作成フォーム */}
      {showCompose && customerEmail && (
        <div style={{ background: 'rgba(255,255,255,0.8)', padding: '20px', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(79,70,229,0.2)', position: 'relative' }}>
          <button onClick={() => setShowCompose(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--text-muted)" /></button>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>📧 新規メール作成</h3>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>宛先</label>
              <p style={{ fontSize: '14px', fontWeight: '500', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px' }}>{customerName} &lt;{customerEmail}&gt;</p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>件名</label>
              <input type="text" value={composeData.subject} onChange={e => setComposeData({...composeData, subject: e.target.value})} required placeholder="件名を入力" className="input-field" style={{ padding: '10px 12px', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>本文</label>
              <textarea value={composeData.body} onChange={e => setComposeData({...composeData, body: e.target.value})} required placeholder="メール本文を入力..." rows={6} className="input-field" style={{ padding: '10px 12px', width: '100%', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowCompose(false)} className="btn" style={{ padding: '8px 16px', fontSize: '13px' }}>キャンセル</button>
              <button type="submit" disabled={isSending} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Send size={14} /> {isSending ? '送信中...' : '送信する'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 統合タイムライン */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {combinedHistory.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <MessageSquare size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '15px', fontWeight: '500' }}>まだ活動履歴がありません</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>「活動を記録」や「新規メール」から顧客とのやりとりを残しましょう。</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '20px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(0,0,0,0.08)' }}></div>
            {combinedHistory.map((item: any, index) => {
              if (!item.isEmailRecord) {
                // CRM内の手動記録メモ
                return (
                  <div key={`interaction-${item.id}`} style={{ display: 'flex', gap: '20px', position: 'relative', padding: '24px 0', minWidth: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.1)', zIndex: 1, color: 'var(--text-main)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      {item.type === 'EMAIL' ? <Mail size={18} color="var(--primary)"/> : item.type === 'CALL' ? <Phone size={18} color="var(--success)"/> : <Briefcase size={18} color="var(--warning)"/>}
                    </div>
                    <div className="glass-panel" style={{ flex: 1, minWidth: 0, padding: '20px', background: 'rgba(255,255,255,0.7)', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                            {item.type === 'EMAIL' ? 'メール (手動記録)' : item.type === 'CALL' ? '電話' : '商談'}
                          </span>
                          {onEditInteraction && (
                            <button onClick={() => onEditInteraction(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }} title="編集">
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', flexShrink: 0 }}>
                          {new Date(item.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.notes}</p>
                    </div>
                  </div>
                );
              } else {
                // Gmail連携メールデータ
                const isExpanded = expandedId === item.id;
                const isSent = item.labelIds?.includes('SENT');
                return (
                  <div key={`email-${item.id}`} style={{ display: 'flex', gap: '20px', position: 'relative', padding: '24px 0', minWidth: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.1)', zIndex: 1, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSent ? 'rgba(79,70,229,0.1)' : 'rgba(234,67,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {isSent ? <ArrowUpRight size={14} color="var(--primary)" /> : <ArrowDownLeft size={14} color="#EA4335" />}
                      </div>
                    </div>
                    <div className="glass-panel" style={{ flex: 1, minWidth: 0, background: isExpanded ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden', transition: 'all 0.2s' }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: '700', background: isSent ? 'var(--primary)' : '#EA4335', color: 'white', flexShrink: 0 }}>
                              {isSent ? '送信' : '受信'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isSent ? `To: ${extractName(item.to)}` : `From: ${extractName(item.from)}`}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                              {new Date(item.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                          </div>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: isExpanded ? '12px' : '4px', whiteSpace: isExpanded ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
                          {item.subject || '(件名なし)'}
                        </p>
                        {!isExpanded && (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.snippet}
                          </p>
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div style={{ padding: '0 20px 20px', cursor: 'default' }}>
                          <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)', maxHeight: '400px', overflowY: 'auto' }}>
                            {item.body || item.snippet || '(本文なし)'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

