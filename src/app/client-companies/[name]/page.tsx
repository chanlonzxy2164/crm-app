"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Target, Users, Presentation, ArrowLeft, MailCheck, Building2, UserCircle, UserPlus } from 'lucide-react';
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

  const fetchCompanyData = async () => {
    try {
      const decodedName = decodeURIComponent(name);
      const res = await fetch(`/api/client-companies/${encodeURIComponent(decodedName)}`);
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const fetched = await res.json();
      setData(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>読み込み中...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>企業が見つかりません</div>;

  const STAGE_LABELS: Record<string, string> = {
    PROSPECTING: '発掘', QUALIFICATION: '評価', PROPOSAL: '提案', WON: '成約', LOST: '失注'
  };

  // 会社全体の数値を集計
  const totalCustomers = data.customers.length;
  let allDeals: Deal[] = [];
  let allInteractions: Interaction[] = [];
  
  data.customers.forEach(c => {
    allDeals = [...allDeals, ...c.deals];
    allInteractions = [...allInteractions, ...c.interactions];
  });
  
  const totalDealAmount = allDeals.reduce((sum, d) => sum + d.amount, 0);
  const wonDeals = allDeals.filter(d => d.stage === 'WON');
  
  // Interactionsを日付順にソート（複数顧客の活動記録を統合）
  allInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            <p className="stat-value">{allInteractions.length}件</p>
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
    </div>
  );
}
