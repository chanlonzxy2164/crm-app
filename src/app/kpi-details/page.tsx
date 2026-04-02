"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Target, Users, Presentation, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function KPIDetailsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) return; 
    setIsLoading(true);
    let url = `/api/kpi-details?period=${period}`;
    if (period === 'custom') {
      url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d);
        setIsLoading(false);
      });
  }, [period, customStartDate, customEndDate]);

  const formatDate = (dStr: string) => {
    const d = new Date(dStr);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
          <ArrowLeft size={16} /> ダッシュボードへ戻る
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Target size={28} color="var(--primary)" /> 会社全体のKPIサマリー詳細
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>期間内の獲得顧客と商談の詳細リスト</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <Calendar size={14} color="var(--text-muted)" />
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '13px', outline: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}
            >
              <option value="this_month">今月</option>
              <option value="last_month">先月</option>
              <option value="this_year">今年</option>
              <option value="all">全期間</option>
              <option value="custom">カスタム（期間指定）</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>データを読み込んでいます...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 新規顧客リスト */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary)" /> 新規獲得顧客 ({data?.newCustomersList?.length || 0}件)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>登録日</th><th>顧客名</th><th>会社名</th><th>担当者</th></tr></thead>
                <tbody>
                  {data?.newCustomersList?.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>期間中の新規顧客はいません</td></tr>
                  ) : data?.newCustomersList?.map((c: any) => (
                    <tr key={c.id}>
                      <td>{formatDate(c.createdAt)}</td>
                      <td style={{ fontWeight: '500' }}>
                        <Link href={`/customers/${c.id}`} style={{ textDecoration: 'none', color: 'var(--primary)' }}>{c.lastName} {c.firstName}</Link>
                      </td>
                      <td>{c.companyName || '-'}</td>
                      <td>{c.user?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 契約獲得リスト */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="var(--success)" /> 成約済み商談 ({data?.wonDealsList?.length || 0}件)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>成約日</th><th>商談名</th><th>顧客</th><th>金額</th></tr></thead>
                <tbody>
                  {data?.wonDealsList?.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>期間中の成約はありません</td></tr>
                  ) : data?.wonDealsList?.map((d: any) => (
                    <tr key={d.id}>
                      <td>{formatDate(d.updatedAt)}</td>
                      <td style={{ fontWeight: '500' }}>{d.name}</td>
                      <td>{d.customer?.lastName} {d.customer?.firstName}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>&yen;{d.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 進行中リスト */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Presentation size={20} color="var(--warning)" /> 進行中の商談 ({data?.activeDealsList?.length || 0}件)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>登録日</th><th>商談名</th><th>顧客</th><th>状況</th><th>金額</th></tr></thead>
                <tbody>
                  {data?.activeDealsList?.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>進行中の商談はありません</td></tr>
                  ) : data?.activeDealsList?.map((d: any) => (
                    <tr key={d.id}>
                      <td>{formatDate(d.createdAt)}</td>
                      <td style={{ fontWeight: '500' }}>{d.name}</td>
                      <td>{d.customer?.lastName} {d.customer?.firstName}</td>
                      <td><span className="badge">{d.stage === 'PROPOSAL' ? '提案' : d.stage === 'QUALIFICATION' ? '評価' : '発掘'}</span></td>
                      <td style={{ fontWeight: 'bold' }}>&yen;{d.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
