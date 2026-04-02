"use client";
import { useState, useEffect } from 'react';
import DashboardCharts from "@/components/DashboardCharts";
import MyActivityChart from "@/components/MyActivityChart";
import { Users, Presentation, Target, MailCheck, LayoutTemplate, X, Grab, Calendar, Phone, Mail, Handshake, BarChart, ArrowRight, UserCircle } from "lucide-react";
import Link from "next/link";

const INITIAL_WIDGETS = [
  { id: 'my-stats', type: 'MyStatsWidget', title: '自分の成績 (KPI)', visible: true },
  { id: 'my-activity-chart', type: 'MyActivityChartWidget', title: '自分の行動履歴グラフ', visible: true },
  { id: 'stats', type: 'StatsWidget', title: '会社全体のKPIサマリー', visible: true },
  { id: 'charts', type: 'ChartsWidget', title: '会社全体の売上・タスクグラフ', visible: true },
  { id: 'activity', type: 'ActivityWidget', title: '会社全体の最近の活動', visible: true }
];

export default function Home() {
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  const [targetUser, setTargetUser] = useState(""); // "" means self
  const [compareMode, setCompareMode] = useState("none");
  const [compStartDate, setCompStartDate] = useState("");
  const [compEndDate, setCompEndDate] = useState("");

  // 初回ロード時および設定変更時にダッシュボードのデータを取得
  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) return; 
    if (compareMode === 'custom' && (!compStartDate || !compEndDate)) return;
    setIsLoading(true);
    let url = `/api/dashboard?period=${period}`;
    if (period === 'custom') {
      url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
    }
    url += `&compareMode=${compareMode}`;
    if (compareMode === 'custom') {
      url += `&compStartDate=${compStartDate}&compEndDate=${compEndDate}`;
    }
    if (targetUser) {
      url += `&targetUser=${targetUser}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [period, targetUser, compareMode, customStartDate, customEndDate, compStartDate, compEndDate]);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EMAIL': return <span className="badge badge-lead">メール</span>;
      case 'CALL': return <span className="badge badge-active">電話</span>;
      case 'MEETING': return <span className="badge badge-active" style={{ background: 'rgba(72,187,120,0.1)', color: 'var(--success)' }}>商談</span>;
      default: return <span className="badge">{type}</span>;
    }
  };

  const getTargetLabel = () => {
    if (targetUser === 'all') return '会社全体';
    if (!targetUser) return '自分の';
    const member = dashboardData?.teamMembers?.find((m: any) => m.id === targetUser);
    return member ? `${member.name}さんの` : '自分の';
  };

  // 比較の差分表示用コンポーネント (パーセント計算追加)
  const DeltaIndicator = ({ current, previous }: { current: number, previous?: number }) => {
    if (previous === undefined || compareMode === 'none') return null;
    const diff = current - previous;
    
    let percentStr = '';
    if (previous === 0) {
      if (current > 0) percentStr = '(+100%)';
      else percentStr = '(±0%)';
    } else {
      const percent = Math.round((diff / previous) * 100);
      percentStr = percent > 0 ? `(+${percent}%)` : `(${percent}%)`;
    }

    if (diff === 0) return <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 'bold' }}>±0 {percentStr}</span>;
    if (diff > 0) return <span style={{ fontSize: '13px', color: 'var(--success)', marginLeft: '8px', fontWeight: 'bold' }}>↑+{diff} <span style={{ fontSize: '11px', opacity: 0.8 }}>{percentStr}</span></span>;
    return <span style={{ fontSize: '13px', color: 'var(--danger)', marginLeft: '8px', fontWeight: 'bold' }}>↓{diff} <span style={{ fontSize: '11px', opacity: 0.8 }}>{percentStr}</span></span>;
  };

  const MyStatsWidget = () => (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <UserCircle size={20} color="var(--primary)" /> {getTargetLabel()}成績 (KPI)
      </h2>
      <div className="dashboard-grid">
        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)', border: '1px solid var(--primary)' }}>
          <p className="stat-title" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>成約数</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.myStats?.contracts || 0}</p>
              <DeltaIndicator current={dashboardData?.myStats?.contracts || 0} previous={dashboardData?.compareStats?.myStats?.contracts} />
            </div>
            <Target size={32} color="var(--primary)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)' }}>
          <p className="stat-title">商談発生数</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.myStats?.opportunities || 0}</p>
              <DeltaIndicator current={dashboardData?.myStats?.opportunities || 0} previous={dashboardData?.compareStats?.myStats?.opportunities} />
            </div>
            <BarChart size={32} color="var(--secondary)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)' }}>
          <p className="stat-title">アポ獲得数</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.myStats?.appointments || 0}</p>
              <DeltaIndicator current={dashboardData?.myStats?.appointments || 0} previous={dashboardData?.compareStats?.myStats?.appointments} />
            </div>
            <Handshake size={32} color="var(--success)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)' }}>
          <p className="stat-title">架電数</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.myStats?.calls || 0}</p>
              <DeltaIndicator current={dashboardData?.myStats?.calls || 0} previous={dashboardData?.compareStats?.myStats?.calls} />
            </div>
            <Phone size={32} color="var(--warning)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)' }}>
          <p className="stat-title">メール数</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.myStats?.emails || 0}</p>
              <DeltaIndicator current={dashboardData?.myStats?.emails || 0} previous={dashboardData?.compareStats?.myStats?.emails} />
            </div>
            <Mail size={32} color="var(--primary)" opacity={0.6}/>
          </div>
        </div>
      </div>
    </div>
  );

  const StatsWidget = () => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
         <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <Target size={20} color="var(--success)" /> 会社全体のKPIサマリー
         </h2>
         <Link href="/kpi-details" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
           詳細分析ページへ <ArrowRight size={14} />
         </Link>
      </div>
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <p className="stat-title">新規顧客</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.newCustomers || 0}</p>
              <DeltaIndicator current={dashboardData?.newCustomers || 0} previous={dashboardData?.compareStats?.newCustomers} />
            </div>
            <Users size={32} color="var(--primary)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <p className="stat-title">契約獲得数</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.wonDeals || 0}</p>
              <DeltaIndicator current={dashboardData?.wonDeals || 0} previous={dashboardData?.compareStats?.wonDeals} />
            </div>
            <Target size={32} color="var(--success)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <p className="stat-title">進行中の商談</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.activeDeals || 0}</p>
              <DeltaIndicator current={dashboardData?.activeDeals || 0} previous={dashboardData?.compareStats?.activeDeals} />
            </div>
            <Presentation size={32} color="var(--warning)" opacity={0.6}/>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <p className="stat-title">活動記録</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <p className="stat-value">{isLoading ? '-' : dashboardData?.recentInteractionsCount || 0}</p>
              <DeltaIndicator current={dashboardData?.recentInteractionsCount || 0} previous={dashboardData?.compareStats?.recentInteractionsCount} />
            </div>
            <MailCheck size={32} color="var(--primary)" opacity={0.6}/>
          </div>
        </div>
      </div>
    </div>
  );

  const ActivityWidget = () => (
    <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>会社全体の最近の活動</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>日時</th>
              <th>顧客名</th>
              <th>タイプ</th>
              <th>メモ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>読み込み中...</td></tr>
            ) : dashboardData?.recentActivities?.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>まだ活動記録がありません</td></tr>
            ) : (
              dashboardData?.recentActivities?.map((activity: any) => (
                <tr key={activity.id}>
                  <td style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{formatDate(activity.date)}</td>
                  <td style={{ fontWeight: '500' }}>{activity.customer?.companyName || ''} {activity.customer?.lastName} {activity.customer?.firstName}</td>
                  <td>{getTypeLabel(activity.type)}</td>
                  <td style={{ fontSize: '14px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutTemplate size={28} color="var(--primary)" /> ダッシュボード
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>営業の進捗情報を一目で確認できます</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* 表示ユーザー切替 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <UserCircle size={14} color="var(--primary)" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>対象:</span>
              <select 
                value={targetUser} 
                onChange={e => setTargetUser(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '13px', outline: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <option value="">自分</option>
                <option value="all">会社全体</option>
                <optgroup label="他メンバー">
                  {dashboardData?.teamMembers?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 期間切替 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>期間:</span>
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

            {/* 比較対象切替 */}
            {period !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <BarChart size={14} color="var(--secondary)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>比較:</span>
                <select 
                  value={compareMode} 
                  onChange={e => setCompareMode(e.target.value)}
                  style={{ background: 'transparent', border: 'none', fontSize: '13px', outline: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}
                >
                  <option value="none">無し</option>
                  <option value="previous_period">前期間</option>
                  <option value="previous_year">前年同期</option>
                  <option value="custom">カスタム</option>
                </select>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>対象期間:</span>
                 <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
                 <span style={{ color: 'var(--text-muted)' }}>〜</span>
                 <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
              </div>
            )}
            
            {compareMode === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>比較期間:</span>
                 <input type="date" value={compStartDate} onChange={e => setCompStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
                 <span style={{ color: 'var(--text-muted)' }}>〜</span>
                 <input type="date" value={compEndDate} onChange={e => setCompEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
              </div>
            )}

            <button 
              className={`btn ${isEditMode ? 'btn-primary' : ''}`} 
              onClick={() => setIsEditMode(!isEditMode)}
              style={{ 
                background: isEditMode ? 'var(--primary)' : 'rgba(255,255,255,0.6)', 
                color: isEditMode ? 'white' : 'var(--text-main)',
                border: isEditMode ? 'none' : '1px solid var(--glass-border)',
                fontSize: '12px', padding: '6px 12px'
              }}
            >
              {isEditMode ? '完了' : 'ウィジェットを編集表示'}
            </button>
          </div>
        </div>
      </div>

      {isEditMode && (
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--primary)' }}>表示するウィジェットの設定 (カスタマイズ・プレビュー)</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {widgets.map(w => (
              <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: w.visible ? 'white' : 'transparent', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.1)' }}>
                <input type="checkbox" checked={w.visible} onChange={() => toggleWidget(w.id)} />
                <span style={{ fontSize: '13px', color: w.visible ? 'var(--text-main)' : 'var(--text-muted)' }}>{w.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ウィジェットのレンダリング部 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {widgets.filter(w => w.visible).map(widget => {
          return (
            <div key={widget.id} style={{ position: 'relative' }}>
              {isEditMode && (
                <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: 'white', padding: '8px', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'grab' }}>
                  <Grab size={14} color="var(--text-muted)" /> <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{widget.title}</span>
                </div>
              )}
              
              <div style={{ opacity: isEditMode ? 0.8 : 1, transition: 'opacity 0.2s', padding: isEditMode ? '8px' : '0', border: isEditMode ? '2px dashed rgba(0,0,0,0.1)' : 'none', borderRadius: '16px' }}>
                {widget.type === 'MyStatsWidget' && <MyStatsWidget />}
                {widget.type === 'MyActivityChartWidget' && <MyActivityChart data={dashboardData?.myActivityChartData} compareStats={dashboardData?.compareStats} myStats={dashboardData?.myStats} title={`${getTargetLabel()}行動履歴 (推移)`} />}
                {widget.type === 'StatsWidget' && <StatsWidget />}
                {widget.type === 'ChartsWidget' && <DashboardCharts taskProgress={dashboardData?.taskProgress} chartData={dashboardData?.chartData} dealsByStage={dashboardData?.dealsByStage} />}
                {widget.type === 'ActivityWidget' && <ActivityWidget />}
              </div>
            </div>
          );
        })}
        {widgets.filter(w => w.visible).length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            表示するウィジェットがありません。「ウィジェットを編集表示」から追加してください。
          </div>
        )}
      </div>
    </div>
  );
}
