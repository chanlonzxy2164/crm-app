"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Target, Users, Presentation, ArrowLeft, MailCheck, Building2, UserCircle, UserPlus, X, Edit2, Mail, Phone, Briefcase, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp, MessageSquare, Plus } from 'lucide-react';
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
  email: string | null;
  phoneNumber: string | null;
  deals: Deal[];
  interactions: Interaction[];
  emailMessages?: any[];
  user?: { id: string; name: string } | null;
}

interface CompanyData {
  companyName: string;
  customers: Customer[];
}

export default function ClientCompanyPage() {
  const { name } = useParams() as { name: string };
  const router = useRouter();
  const [data, setData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [assigningUserId, setAssigningUserId] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const [interactionData, setInteractionData] = useState({ id: '', type: 'MEETING', notes: '', customerId: '', userId: '' });
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false);

  useEffect(() => {
    fetchCompanyData();
    fetch('/api/settings/users')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTenantUsers(d); })
      .catch(() => {});
  }, [name]);

  const handleAssignUser = async () => {
    if (!assigningUserId) return;
    try {
      const decodedName = decodeURIComponent(name);
      await fetch(`/api/client-companies/${encodeURIComponent(decodedName)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assigningUserId })
      });
      alert('全ての所属担当者に一括で担当ユーザーを紐付けました。');
      setAssigningUserId('');
      fetchCompanyData();
    } catch (err) { console.error(err); }
  };

  const handleEditClick = () => {
    if (data) {
      setEditCompanyName(data.companyName);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyName.trim()) return;
    setIsSaving(true);
    try {
      const decodedName = decodeURIComponent(name);
      const res = await fetch(`/api/client-companies/${encodeURIComponent(decodedName)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCompanyName: editCompanyName })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        router.push(`/client-companies/${encodeURIComponent(editCompanyName)}`);
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

  const fetchCompanyData = async () => {
    try {
      const decodedName = decodeURIComponent(name);
      const res = await fetch(`/api/client-companies/${encodeURIComponent(decodedName)}`);
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const fetched = await res.json();
      if (fetched && !fetched.error && fetched.companyName) {
        setData(fetched);
      } else {
        console.error('API Error:', fetched);
        setData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionData.customerId) {
      alert("顧客（相手先）を選択してください");
      return;
    }
    setIsSubmittingInteraction(true);
    try {
      const url = interactionData.id ? `/api/interactions/${interactionData.id}` : '/api/interactions';
      const method = interactionData.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      });
      if (res.ok) {
        setInteractionData({ id: '', type: 'MEETING', notes: '', customerId: '', userId: '' });
        setIsInteractionFormOpen(false);
        fetchCompanyData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingInteraction(false);
    }
  };

  const handleEditInteraction = (interaction: any) => {
    setInteractionData({
      id: interaction.id,
      type: interaction.type,
      notes: interaction.notes || '',
      customerId: interaction.customerId || '',
      userId: interaction.userId || ''
    });
    setIsInteractionFormOpen(true);
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>読み込み中...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>企業が見つかりません</div>;

  const STAGE_LABELS: Record<string, string> = {
    PROSPECTING: '発掘', QUALIFICATION: '評価', PROPOSAL: '提案', WON: '成約', LOST: '失注'
  };

  // 会社全体の数値を集計
  const totalCustomers = data.customers.length;
  let allDeals: Deal[] = [];
  let allHistory: any[] = [];
  
  data.customers.forEach(c => {
    allDeals = [...allDeals, ...c.deals];
    (c.interactions || []).forEach(i => {
      allHistory.push({ ...i, isEmailRecord: false, sortDate: new Date(i.date).getTime(), customerName: `${c.lastName} ${c.firstName}` });
    });
    (c.emailMessages || []).forEach(e => {
      allHistory.push({ ...e, isEmailRecord: true, sortDate: new Date(e.date).getTime(), customerName: `${c.lastName} ${c.firstName}` });
    });
  });
  
  const totalDealAmount = allDeals.reduce((sum, d) => sum + d.amount, 0);
  const wonDeals = allDeals.filter(d => d.stage === 'WON');
  
  // 統合履歴を日付順にソート
  allHistory.sort((a, b) => b.sortDate - a.sortDate);

  const extractName = (emailStr: string) => {
    if (!emailStr) return '';
    const match = emailStr.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].replace(/"/g, '') : emailStr.split('@')[0];
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
              <Building2 size={32} color="var(--primary)" />
              {data.companyName}
              <button 
                onClick={handleEditClick}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', padding: '6px 16px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '8px', fontWeight: '600', marginLeft: '4px' }}
                title="企業名を編集"
              >
                <Edit2 size={16} /> 編集
              </button>
            </h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-muted)', marginTop: '8px' }}>
              顧客企業詳細ページ
            </p>
            {data.customers[0]?.user && (
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--primary)', marginTop: '4px', fontWeight: 'bold' }}>
                自社担当者: {data.customers[0].user.name}
              </p>
            )}
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px' }}>
            <UserPlus size={18} color="var(--primary)" />
            <select 
              value={assigningUserId} 
              onChange={e => setAssigningUserId(e.target.value)}
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
            >
              <option value="">担当ユーザーを選択...</option>
              {tenantUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button onClick={handleAssignUser} disabled={!assigningUserId} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
              自社担当に設定
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="glass-panel stat-card">
          <p className="stat-title">登録担当者数</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="stat-value">{totalCustomers}名</p>
            <Users size={32} color="var(--primary)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <p className="stat-title">総商談件数 / 成約</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="stat-value">{allDeals.length} / {wonDeals.length}</p>
            <Target size={32} color="var(--success)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <p className="stat-title">全商談の合計金額</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="stat-value" style={{ fontSize: '20px' }}>&yen;{totalDealAmount.toLocaleString()}</p>
            <Presentation size={32} color="var(--warning)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <p className="stat-title">累計活動記録</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="stat-value">{allHistory.length}件</p>
            <MailCheck size={32} color="var(--primary)" opacity={0.6}/>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1.5fr) minmax(300px, 1fr)', gap: '32px', alignItems: 'start' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>担当者一覧</h2>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {data.customers.map(c => (
              <Link href={`/customers/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid var(--glass-border)', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'white'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}>
                  <UserCircle size={40} color="var(--primary)" opacity={0.8} />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{c.lastName} {c.firstName}</h3>
                    {c.email && <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MailCheck size={12} /> {c.email}</p>}
                    {c.phoneNumber && <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><span style={{ fontSize: '10px' }}>📞</span> {c.phoneNumber}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      {c.deals.length > 0 && <span style={{ fontSize: '10px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>商談あり</span>}
                      {c.interactions.length > 0 && <span style={{ fontSize: '10px', background: 'var(--success)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>活動記録 {c.interactions.length}件</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>関連する商談</h2>
            <Link href="/deals" className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--primary)', color: 'white' }}>一覧へ</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {allDeals.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>この企業の商談はありません</p> : 
              allDeals.map(deal => (
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

      <div className="glass-panel" style={{ padding: '32px', marginTop: '32px', minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>企業全体の対応・活動履歴</h2>
          {!isInteractionFormOpen && (
            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => {
              setInteractionData({ id: '', type: 'MEETING', notes: '', customerId: '', userId: '' });
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
                  <label className="form-label">顧客 (相手先) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="input-field" value={interactionData.customerId} onChange={e => setInteractionData({...interactionData, customerId: e.target.value})} required>
                    <option value="">選択してください</option>
                    {data.customers.map(c => <option key={c.id} value={c.id}>{c.lastName} {c.firstName}</option>)}
                  </select>
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
                <button type="submit" className="btn btn-primary" disabled={isSubmittingInteraction}>
                  {isSubmittingInteraction ? '保存中...' : '記録を保存'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {allHistory.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <MessageSquare size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '15px', fontWeight: '500' }}>まだ活動履歴がありません</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '20px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(0,0,0,0.08)' }}></div>
              {allHistory.map((item: any, index) => {
                if (!item.isEmailRecord) {
                  return (
                    <div key={`interaction-${item.id}`} style={{ display: 'flex', gap: '20px', position: 'relative', padding: '24px 0', minWidth: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.1)', zIndex: 1, color: 'var(--text-main)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        {item.type === 'EMAIL' ? <Mail size={18} color="var(--primary)"/> : item.type === 'CALL' ? <Phone size={18} color="var(--success)"/> : <Briefcase size={18} color="var(--warning)"/>}
                      </div>
                      <div className="glass-panel" style={{ flex: 1, minWidth: 0, padding: '20px', background: 'rgba(255,255,255,0.7)', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.type === 'EMAIL' ? 'メール (手動記録)' : item.type === 'CALL' ? '電話' : '商談'}
                            <span style={{ color: 'var(--primary)', marginLeft: '8px' }}>@{item.customerName}</span>
                          </span>
                          <button onClick={() => handleEditInteraction(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }} title="編集">
                            <Edit2 size={14} />
                          </button>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', flexShrink: 0 }}>
                          {new Date(item.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{item.notes}</p>
                      </div>
                    </div>
                  );
                } else {
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
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                                {isSent ? `To: ${item.customerName}` : `From: ${item.customerName}`}
                                <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 'normal', fontSize: '12px' }}>
                                  ({isSent ? '送信' : '受信'}: {item.user?.name || '自社担当'})
                                </span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                                {new Date(item.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                            </div>
                          </div>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: isExpanded ? '12px' : '4px', whiteSpace: isExpanded ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-all' }}>
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
                            <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)', maxHeight: '400px', overflowY: 'auto' }}>
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
      </div>

      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', margin: '20px' }}>
            <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>企業名の編集</h2>
            <form onSubmit={handleSaveCompany}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>企業名 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" className="input-field" value={editCompanyName} onChange={e => setEditCompanyName(e.target.value)} required style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} placeholder="株式会社〇〇" />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>※この変更は、関連するすべての顧客の「顧客企業名」にも反映されます。</p>
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
