"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, Calendar, Briefcase, Plus, ArrowLeft, X, MessageSquare, Building2, UserCircle, Edit2 } from 'lucide-react';
import Link from 'next/link';
import CustomerEmailSection from '@/components/CustomerEmailSection';

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
  const [interactionData, setInteractionData] = useState({ id: '', type: 'EMAIL', notes: '', userId: '' });
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ firstName: '', lastName: '', companyName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomer();
    fetch('/api/settings/users')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTenantUsers(d); })
      .catch(() => {});
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

  const handleEditClick = () => {
    if (customer) {
      setEditData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        companyName: customer.companyName || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        status: customer.status || 'ACTIVE'
      });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchCustomer();
      } else {
        alert('保存に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = interactionData.id ? `/api/interactions/${interactionData.id}` : '/api/interactions';
      const method = interactionData.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...interactionData, customerId: id })
      });
      if (res.ok) {
        setInteractionData({ id: '', type: 'EMAIL', notes: '', userId: '' });
        setIsInteractionFormOpen(false);
        fetchCustomer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInteraction = (interaction: any) => {
    setInteractionData({
      id: interaction.id,
      type: interaction.type,
      notes: interaction.notes || '',
      userId: interaction.userId || ''
    });
    setIsInteractionFormOpen(true);
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '32px', wordBreak: 'break-all' }}>
              {customer.lastName} {customer.firstName}
              <button 
                onClick={handleEditClick}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', padding: '6px 16px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '8px', fontWeight: '600', marginLeft: '8px' }}
                title="顧客情報を編集"
              >
                <Edit2 size={16} /> 編集
              </button>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'start', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: '1 1 300px', minWidth: 0 }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>連絡先情報</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>メールアドレス</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '500', wordBreak: 'break-all' }}><Mail size={18} color="var(--primary)" style={{ flexShrink: 0 }}/> {customer.email || '未設定'}</p>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>電話番号</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '500', wordBreak: 'break-all' }}><Phone size={18} color="var(--success)" style={{ flexShrink: 0 }}/> {customer.phoneNumber || '未設定'}</p>
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

          <div className="glass-panel" style={{ padding: '32px', minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>関連する商談</h2>
              <Link href="/deals" className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--primary)', color: 'white' }}>
                一覧へ
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customer.deals.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>商談はありません</p> : 
                customer.deals.map(deal => (
                  <div key={deal.id} className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.8)', borderLeft: `6px solid ${deal.stage === 'WON' ? 'var(--success)' : deal.stage === 'LOST' ? 'var(--danger)' : 'var(--primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start', gap: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', lineHeight: '1.4', wordBreak: 'break-all' }}>{deal.name}</h3>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>&yen;{deal.amount.toLocaleString()}</span>
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

        <div className="glass-panel" style={{ padding: '32px', minHeight: '600px', flex: '1.5 1 350px', minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>対応・活動履歴</h2>
            {!isInteractionFormOpen && (
              <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => {
                setInteractionData({ id: '', type: 'EMAIL', notes: '', userId: '' });
                setIsInteractionFormOpen(true);
              }}>
                <Plus size={16} /> 活動を記録
              </button>
            )}
          </div>

          {isInteractionFormOpen && (
            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
              <button onClick={() => setIsInteractionFormOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>{interactionData.id ? '活動記録を編集' : '新しい履歴を追加'}</h3>
              <form onSubmit={handleAddInteraction}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label className="form-label">担当者 (自社)</label>
                    <select className="input-field" value={interactionData.userId} onChange={e => setInteractionData({...interactionData, userId: e.target.value})}>
                      <option value="">自分 (ログインユーザー)</option>
                      {tenantUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label className="form-label">顧客 (相手先)</label>
                    <input className="input-field" value={`${customer.lastName} ${customer.firstName}`} disabled style={{ background: 'rgba(0,0,0,0.02)' }} />
                  </div>
                </div>
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

          <div style={{ marginTop: '24px' }}>
            <CustomerEmailSection
              customerId={id}
              customerEmail={customer.email}
              customerName={`${customer.lastName} ${customer.firstName}`}
              interactions={customer.interactions}
              onEditInteraction={handleEditInteraction}
            />
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', margin: '20px' }}>
            <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>顧客情報の編集</h2>
            <form onSubmit={handleSaveCustomer}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>姓 <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="text" className="input-field" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} required style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>名 <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="text" className="input-field" value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} required style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>顧客企業名</label>
                <input type="text" className="input-field" value={editData.companyName} onChange={e => setEditData({...editData, companyName: e.target.value})} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} placeholder="株式会社〇〇" />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>メールアドレス</label>
                <input type="email" className="input-field" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} placeholder="example@company.com" />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>電話番号</label>
                <input type="tel" className="input-field" value={editData.phoneNumber} onChange={e => setEditData({...editData, phoneNumber: e.target.value})} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} placeholder="090-0000-0000" />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>ステータス</label>
                <select className="input-field" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <option value="ACTIVE">顧客（ACTIVE）</option>
                  <option value="LEAD">見込み（LEAD）</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" onClick={() => setIsEditModalOpen(false)} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', padding: '10px 16px', borderRadius: '8px', fontWeight: '600' }}>キャンセル</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ padding: '10px 16px', borderRadius: '8px', fontWeight: '600' }}>
                  {isSaving ? '保存中...' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
