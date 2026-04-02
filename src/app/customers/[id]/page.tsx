"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, Calendar, Briefcase, Plus, ArrowLeft, X, MessageSquare, Building2, UserCircle } from 'lucide-react';
import Link from 'next/link';

interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  createdAt: string;
}

interface Interaction {
  id: string;
  type: string;
  notes: string | null;
  date: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  lastContactAt: string | null;
  deals: Deal[];
  interactions: Interaction[];
  user?: { id: string; name: string } | null;
}

export default function CustomerDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const [interactionData, setInteractionData] = useState({ type: 'EMAIL', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) {
        if (res.status === 404) router.push('/customers');
        return;
      }
      const data = await res.json();
      if (data && !data.error && data.id) {
        setCustomer(data);
      } else {
        console.error('API Error:', data);
        setCustomer(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...interactionData, customerId: id })
      });
      if (res.ok) {
        setInteractionData({ type: 'EMAIL', notes: '' });
        setIsInteractionFormOpen(false);
        fetchCustomer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>読み込み中...</div>;
  if (!customer) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>顧客が見つかりません</div>;

  const STAGE_LABELS: Record<string, string> = {
    PROSPECTING: '発掘', QUALIFICATION: '評価', PROPOSAL: '提案', WON: '成約', LOST: '失注'
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <button onClick={() => router.push('/customers')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
          <ArrowLeft size={16} /> 顧客一覧へ戻る
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '16px', fontSize: '32px' }}>
              {customer.lastName} {customer.firstName}
              <span className={`badge ${customer.status === 'ACTIVE' ? 'badge-active' : 'badge-lead'}`}>{customer.status === 'ACTIVE' ? '顧客' : '見込み'}</span>
            </h1>
            {customer.companyName && (
              <Link href={`/client-companies/${encodeURIComponent(customer.companyName)}`} style={{ textDecoration: 'none' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--primary)', marginTop: '8px', transition: 'opacity 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                  <Building2 size={18} /> {customer.companyName} <span style={{ fontSize: '12px', background: 'rgba(66, 153, 225, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>企業詳細を見る</span>
                </p>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(350px, 1.5fr)', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>連絡先情報</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>メールアドレス</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '500' }}><Mail size={18} color="var(--primary)"/> {customer.email || '未設定'}</p>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>電話番号</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '500' }}><Phone size={18} color="var(--success)"/> {customer.phoneNumber || '未設定'}</p>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>最終連絡日</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: 'var(--text-main)', fontWeight: '500' }}>
                  <Calendar size={18} color="var(--warning)"/> {customer.lastContactAt ? new Date(customer.lastContactAt).toLocaleDateString() : 'なし'}
                </p>
              </div>
              {customer.user && (
                <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>自社担当者</span>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: 'var(--primary)', fontWeight: 'bold' }}>
                    <UserCircle size={18} /> {customer.user.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>関連する商談</h2>
              <Link href="/deals" className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--primary)', color: 'white' }}>
                一覧へ
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customer.deals.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>商談はありません</p> : 
                customer.deals.map(deal => (
                  <div key={deal.id} className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.8)', borderLeft: `6px solid ${deal.stage === 'WON' ? 'var(--success)' : deal.stage === 'LOST' ? 'var(--danger)' : 'var(--primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', lineHeight: '1.4' }}>{deal.name}</h3>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', whiteSpace: 'nowrap', marginLeft: '12px' }}>&yen;{deal.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-main)' }}>{STAGE_LABELS[deal.stage]}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{new Date(deal.createdAt).toLocaleDateString()} に作成</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px', minHeight: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>対応・活動履歴</h2>
            {!isInteractionFormOpen && (
              <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setIsInteractionFormOpen(true)}>
                <Plus size={16} /> 活動を記録
              </button>
            )}
          </div>

          {isInteractionFormOpen && (
            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
              <button onClick={() => setIsInteractionFormOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>新しい履歴を追加</h3>
              <form onSubmit={handleAddInteraction}>
                <div className="form-group">
                  <label className="form-label">活動の種類</label>
                  <div style={{ position: 'relative' }}>
                    <select className="input-field" value={interactionData.type} onChange={e => setInteractionData({...interactionData, type: e.target.value})} style={{ appearance: 'none' }}>
                      <option value="EMAIL">📧 メール送信・受信</option>
                      <option value="CALL">📞 電話でのやり取り</option>
                      <option value="MEETING">💼 商談・打ち合わせ</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">メモ・内容</label>
                  <textarea className="input-field" placeholder="（例）製品の料金体系について質問があり、見積もりを送付した。" rows={4} value={interactionData.notes} onChange={e => setInteractionData({...interactionData, notes: e.target.value})} required style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? '保存中...' : '記録を保存'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {customer.interactions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <MessageSquare size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ fontSize: '15px', fontWeight: '500' }}>まだ活動履歴がありません</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>「活動を記録」から顧客とのやりとりを残しましょう。</p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '20px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(0,0,0,0.08)' }}></div>
                {customer.interactions.map((interaction, index) => (
                  <div key={interaction.id} style={{ display: 'flex', gap: '20px', position: 'relative', padding: '24px 0' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.1)', zIndex: 1, color: 'var(--text-main)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      {interaction.type === 'EMAIL' ? <Mail size={18} color="var(--primary)"/> : interaction.type === 'CALL' ? <Phone size={18} color="var(--success)"/> : <Briefcase size={18} color="var(--warning)"/>}
                    </div>
                    <div className="glass-panel" style={{ flex: 1, padding: '20px', background: 'rgba(255,255,255,0.7)', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                          {interaction.type === 'EMAIL' ? 'メール' : interaction.type === 'CALL' ? '電話' : '商談'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {new Date(interaction.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{interaction.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
