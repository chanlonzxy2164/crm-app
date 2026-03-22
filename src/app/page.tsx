"use client";
import { useState, useEffect } from 'react';
import DashboardCharts from "@/components/DashboardCharts";
import { Users, Presentation, Target, MailCheck, LayoutTemplate, X, Grab, Calendar } from "lucide-react";

const INITIAL_WIDGETS = [
  { id: 'stats', type: 'StatsWidget', title: 'KPIサマリー', visible: true },
  { id: 'charts', type: 'ChartsWidget', title: '売上・タスクグラフ', visible: true },
  { id: 'activity', type: 'ActivityWidget', title: '最近の活動', visible: true }
];

export default function Home() {
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // 初回ロード時およびperiod変更時にダッシュボードのデータを取得
  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) return; // カスタムの場合は両方入力されるまでfetchしない
    setIsLoading(true);
    let url = `/api/dashboard?period=${period}`;
    if (period === 'custom') {
      url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
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
  }, [period]);

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

  const StatsWidget = () => (
    <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
      <div className="glass-panel stat-card">
        <p className="stat-title">新規顧客</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="stat-value">{isLoading ? '-' : dashboardData?.newCustomers || 0}</p>
          <Users size={32} color="var(--primary)" opacity={0.6}/>
        </div>
      </div>
      <div className="glass-panel stat-card">
        <p className="stat-title">契約獲得数</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="stat-value">{isLoading ? '-' : dashboardData?.wonDeals || 0}</p>
          <Target size={32} color="var(--success)" opacity={0.6}/>
        </div>
      </div>
      <div className="glass-panel stat-card">
        <p className="stat-title">進行中の商談</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="stat-value">{isLoading ? '-' : dashboardData?.activeDeals || 0}</p>
          <Presentation size={32} color="var(--warning)" opacity={0.6}/>
        </div>
      </div>
      <div className="glass-panel stat-card">
        <p className="stat-title">活動記録</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="stat-value">{isLoading ? '-' : dashboardData?.recentInteractionsCount || 0}</p>
          <MailCheck size={32} color="var(--primary)" opacity={0.6}/>
        </div>
      </div>
    </div>
  );

  const ActivityWidget = () => (
    <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>最近の活動</h2>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutTemplate size={28} color="var(--primary)" /> ダッシュボード
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>営業の進捗情報を一目で確認できます</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <Calendar size={14} color="var(--text-muted)" />
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '13px', outline: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <option value="this_month">今月</option>
              <option value="last_month">先月</option>
              <option value="this_year">今年</option>
              <option value="all">全期間</option>
              <option value="custom">カスタム（期間指定）</option>
            </select>
          </div>
          
          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
               <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
               <span style={{ color: 'var(--text-muted)' }}>〜</span>
               <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
            </div>
          )}

          <button 
            className={`btn ${isEditMode ? 'btn-primary' : ''}`} 
            onClick={() => setIsEditMode(!isEditMode)}
            style={{ 
              background: isEditMode ? 'var(--primary)' : 'rgba(255,255,255,0.6)', 
              color: isEditMode ? 'white' : 'var(--text-main)',
              border: isEditMode ? 'none' : '1px solid var(--glass-border)'
            }}
          >
            {isEditMode ? '完了' : 'ウィジェットを編集表示'}
          </button>
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
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>※将来的にドラッグ＆ドロップでの並び替えに対応します</p>
        </div>
      )}

      {/* ウィジェットのレンダリング部（配置順に展開） */}
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
                {widget.type === 'StatsWidget' && <StatsWidget />}
                {widget.type === 'ChartsWidget' && <DashboardCharts taskProgress={dashboardData?.taskProgress} chartData={dashboardData?.chartData} dealsByStage={dashboardData?.dealsByStage} />}
                {widget.type === 'ActivityWidget' && <ActivityWidget />}
              </div>
            </div>
          );
        })}
        {widgets.filter(w => w.visible).length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            表示するウィジェットがありません。「ウィジェットを編集」から追加してください。
          </div>
        )}
      </div>
    </div>
  );
}
