"use client";
import React, { useState, useEffect } from 'react';
import { Users, Presentation, Target, MailCheck, LayoutTemplate, Grab, Calendar, Phone, Mail, Handshake, BarChart, ArrowRight, UserCircle, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import MyActivityChart from "@/components/MyActivityChart";

// ダイナミックウィジェット定義
type WidgetConfig = {
  id: string;
  type: 'MetricGrid' | 'Chart' | 'ActivityTable' | 'TaskProgress' | 'MyActivityChart';
  title: string;
  visible: boolean;
  gridMetrics?: string[]; 
  chartDataKey?: string; 
  chartType?: 'Line' | 'Bar' | 'Numeric';
  chartGridTitle?: string;
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w-mystats', type: 'MetricGrid', title: '自分の成績 (KPI)', visible: true, gridMetrics: ['my_contracts', 'my_opportunities', 'my_appointments', 'my_calls', 'my_emails'] },
  { id: 'w-myactivity', type: 'MyActivityChart', title: '自分の行動履歴グラフ', visible: true },
  { id: 'w-compstats', type: 'MetricGrid', title: '会社全体のKPIサマリー', visible: true, gridMetrics: ['comp_newCust', 'comp_wonDeals', 'comp_activeDeals', 'comp_interactions'] },
  { id: 'w-revchart', type: 'Chart', title: '今月の契約金額 (推移)', visible: true, chartDataKey: '契約金額', chartType: 'Line' },
  { id: 'w-taskprog', type: 'TaskProgress', title: 'タスク進捗 & 商談フェーズ', visible: true },
  { id: 'w-activity', type: 'ActivityTable', title: '会社全体の最近の活動', visible: true }
];

const METRIC_DICT: Record<string, { label: string, icon: any, color: string, getVal: (d:any)=>number, getComp: (d:any)=>number|undefined }> = {
  my_contracts: { label: '成約数', icon: Target, color: 'var(--primary)', getVal: d => d?.myStats?.contracts || 0, getComp: d => d?.compareStats?.myStats?.contracts },
  my_opportunities: { label: '商談発生数', icon: BarChart, color: 'var(--secondary)', getVal: d => d?.myStats?.opportunities || 0, getComp: d => d?.compareStats?.myStats?.opportunities },
  my_appointments: { label: 'アポ獲得数', icon: Handshake, color: 'var(--success)', getVal: d => d?.myStats?.appointments || 0, getComp: d => d?.compareStats?.myStats?.appointments },
  my_calls: { label: '架電数', icon: Phone, color: 'var(--warning)', getVal: d => d?.myStats?.calls || 0, getComp: d => d?.compareStats?.myStats?.calls },
  my_emails: { label: 'メール数', icon: Mail, color: 'var(--primary)', getVal: d => d?.myStats?.emails || 0, getComp: d => d?.compareStats?.myStats?.emails },
  my_appt_rate: { 
    label: 'アポ獲得率', icon: Handshake, color: 'var(--success)', 
    getVal: d => { const acts = (d?.myStats?.calls||0) + (d?.myStats?.emails||0); return acts ? Math.round(((d?.myStats?.appointments||0)/acts)*100) : 0; }, 
    getComp: d => { const acts = (d?.compareStats?.myStats?.calls||0) + (d?.compareStats?.myStats?.emails||0); return acts ? Math.round(((d?.compareStats?.myStats?.appointments||0)/acts)*100) : undefined; } 
  },
  comp_newCust: { label: '新規顧客', icon: Users, color: 'var(--primary)', getVal: d => d?.newCustomers || 0, getComp: d => d?.compareStats?.newCustomers },
  comp_wonDeals: { label: '契約獲得数', icon: Target, color: 'var(--success)', getVal: d => d?.wonDeals || 0, getComp: d => d?.compareStats?.wonDeals },
  comp_activeDeals: { label: '進行中の商談', icon: Presentation, color: 'var(--warning)', getVal: d => d?.activeDeals || 0, getComp: d => d?.compareStats?.activeDeals },
  comp_interactions: { label: '活動記録', icon: MailCheck, color: 'var(--primary)', getVal: d => d?.recentInteractionsCount || 0, getComp: d => d?.compareStats?.recentInteractionsCount }
};

export default function Home() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [targetUser, setTargetUser] = useState(""); 
  const [compareMode, setCompareMode] = useState("none");
  const [compStartDate, setCompStartDate] = useState("");
  const [compEndDate, setCompEndDate] = useState("");

  useEffect(() => {
    // LocalStorageから設定を復元、なければ初期設定を使う
    const saved = localStorage.getItem('crm-dashboard-widgets');
    if (saved) {
      try { setWidgets(JSON.parse(saved)); } catch(e) { setWidgets(DEFAULT_WIDGETS); }
    } else {
      setWidgets(DEFAULT_WIDGETS);
    }
  }, []);

  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) return; 
    if (compareMode === 'custom' && (!compStartDate || !compEndDate)) return;
    setIsLoading(true);
    let url = `/api/dashboard?period=${period}`;
    if (period === 'custom') url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
    url += `&compareMode=${compareMode}`;
    if (compareMode === 'custom') url += `&compStartDate=${compStartDate}&compEndDate=${compEndDate}`;
    if (targetUser) url += `&targetUser=${targetUser}`;

    fetch(url).then(res => res.json()).then(data => { setDashboardData(data); setIsLoading(false); }).catch(() => setIsLoading(false));
  }, [period, targetUser, compareMode, customStartDate, customEndDate, compStartDate, compEndDate]);

  const saveWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('crm-dashboard-widgets', JSON.stringify(newWidgets));
  };

  const getTargetLabel = () => {
    if (targetUser === 'all') return '会社全体';
    if (!targetUser) return '自分';
    const member = dashboardData?.teamMembers?.find((m: any) => m.id === targetUser);
    return member ? `${member.name}さん` : '自分';
  };

  const DeltaIndicator = ({ current, previous, isPercentOutput = false }: { current: number, previous?: number, isPercentOutput?: boolean }) => {
    if (previous === undefined || compareMode === 'none') return null;
    const diff = current - previous;
    let percentStr = '';
    if (previous === 0) {
      percentStr = current > 0 ? '(+100%)' : '(±0%)';
    } else {
      const p = Math.round((diff / previous) * 100);
      percentStr = p > 0 ? `(+${p}%)` : `(${p}%)`;
    }
    const absDiff = isPercentOutput ? `${diff}%` : diff;
    const displayStr = isPercentOutput ? '' : percentStr; // もし値自体が%なら括弧の%は省く

    if (diff === 0) return <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 'bold' }}>±0 {displayStr}</span>;
    if (diff > 0) return <span style={{ fontSize: '13px', color: 'var(--success)', marginLeft: '8px', fontWeight: 'bold' }}>↑+{absDiff} <span style={{ fontSize: '11px', opacity: 0.8 }}>{displayStr}</span></span>;
    return <span style={{ fontSize: '13px', color: 'var(--danger)', marginLeft: '8px', fontWeight: 'bold' }}>↓{absDiff} <span style={{ fontSize: '11px', opacity: 0.8 }}>{displayStr}</span></span>;
  };

  const renderWidgetContent = (widget: WidgetConfig) => {
    if (widget.type === 'MetricGrid') {
      return (
        <div className="dashboard-grid">
          {widget.gridMetrics?.map(metricKey => {
            const m = METRIC_DICT[metricKey];
            if (!m) return null;
            const current = m.getVal(dashboardData);
            const previous = m.getComp(dashboardData);
            const isRate = metricKey.includes('rate');
            const IconGroup = m.icon;
            return (
              <div key={metricKey} className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)', position: 'relative' }}>
                <p className="stat-title">{m.label.replace('自分', getTargetLabel())}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <p className="stat-value">{isLoading ? '-' : current}{isRate?'%':''}</p>
                    {dashboardData && <DeltaIndicator current={current} previous={previous} isPercentOutput={isRate} />}
                  </div>
                  <IconGroup size={32} color={m.color} opacity={0.6}/>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    if (widget.type === 'Chart') {
      const dataKey = widget.chartDataKey || '契約金額';
      const cData = dashboardData?.chartData || [];
      const totalNum = cData.reduce((sum:number, d:any) => sum + (d[dataKey]||0), 0);
      const prevTotal = Object.keys(cData[0]||{}).includes(`${dataKey} (比較)`) 
        ? cData.reduce((sum:number, d:any) => sum + (d[`${dataKey} (比較)`]||0), 0) : undefined;
      
      if (widget.chartType === 'Numeric') {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column' }}>
            <p style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary)' }}>{isLoading ? '-' : totalNum.toLocaleString()} {dataKey.includes('金額') ? '円' : '件'}</p>
            {dashboardData && <DeltaIndicator current={totalNum} previous={prevTotal} />}
          </div>
        );
      }

      return (
        <div style={{ width: '100%', height: '300px' }}>
          {!isLoading && cData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {widget.chartType === 'Bar' ? (
                <RechartsBar data={cData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <RechartsTooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey={dataKey} fill="var(--primary)" />
                  {cData[0] && cData[0][`${dataKey} (比較)`] !== undefined && <Bar dataKey={`${dataKey} (比較)`} fill="#9ca3af" />}
                </RechartsBar>
              ) : (
                <LineChart data={cData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <RechartsTooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey={dataKey} stroke="var(--primary)" strokeWidth={3} />
                  {cData[0] && cData[0][`${dataKey} (比較)`] !== undefined && <Line type="monotone" dataKey={`${dataKey} (比較)`} stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />}
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : <p style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>データがありません</p>}
        </div>
      );
    }

    if (widget.type === 'TaskProgress') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>完了</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardData?.taskProgress?.completed || 0} <span style={{fontSize: '14px', color: 'var(--success)'}}>タスク</span></p>
            </div>
            <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>進行中</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboardData?.taskProgress?.active || 0} <span style={{fontSize: '14px', color: 'var(--warning)'}}>タスク</span></p>
            </div>
          </div>
          {dashboardData?.dealsByStage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>進行中の商談フェーズ内訳</h3>
              {dashboardData.dealsByStage.map((d:any) => (
                <div key={d.stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>{d.stage}</span>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{d._count.id}件</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (widget.type === 'MyActivityChart') {
      return <MyActivityChart data={dashboardData?.myActivityChartData} compareStats={dashboardData?.compareStats} myStats={dashboardData?.myStats} title="" />;
    }

    if (widget.type === 'ActivityTable') {
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>日時</th><th>顧客名</th><th>メモ</th></tr></thead>
            <tbody>
              {dashboardData?.recentActivities?.slice(0,5).map((act:any) => (
                <tr key={act.id}>
                  <td style={{ fontSize: '12px' }}>{new Date(act.date).toLocaleDateString()}</td>
                  <td>{act.customer?.lastName}</td>
                  <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const handleCreateWidget = () => {
    const newW: WidgetConfig = {
      id: `w-${Date.now()}`,
      type: 'MetricGrid',
      title: '新規ウィジェット',
      visible: true,
      gridMetrics: ['my_contracts']
    };
    saveWidgets([...widgets, newW]);
    setEditingWidget(newW);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutTemplate size={28} color="var(--primary)" /> ダッシュボード
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>ウィジェットを自由に追加・編集できます</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {/* コントロール群 (対象, 期間, 比較) */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <UserCircle size={14} color="var(--primary)" />
              <select value={targetUser} onChange={e => setTargetUser(e.target.value)} style={{ background: 'transparent', border: 'none', fontSize: '13px', outline: 'none', fontWeight: 'bold' }}>
                <option value="">自分</option><option value="all">会社全体</option>
                <optgroup label="他メンバー">
                  {dashboardData?.teamMembers?.map((m: any) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </optgroup>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ background: 'transparent', border: 'none', fontSize: '13px', outline: 'none', fontWeight: '500' }}>
                <option value="this_month">今月</option><option value="last_month">先月</option>
                <option value="this_year">今年</option><option value="all">全期間</option><option value="custom">カスタム</option>
              </select>
            </div>

            {period !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <BarChart size={14} color="var(--secondary)" />
                <select value={compareMode} onChange={e => setCompareMode(e.target.value)} style={{ background: 'transparent', border: 'none', fontSize: '13px', outline: 'none', fontWeight: '500' }}>
                  <option value="none">比較なし</option><option value="previous_period">前期間</option><option value="previous_year">前年同期</option><option value="custom">カスタム</option>
                </select>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`btn ${isEditMode ? 'btn-primary' : ''}`} onClick={() => setIsEditMode(!isEditMode)} style={{ background: isEditMode ? 'var(--primary)' : 'rgba(255,255,255,0.6)', color: isEditMode ? 'white' : 'var(--text-main)', border: isEditMode ? 'none' : '1px solid var(--glass-border)', fontSize: '12px', padding: '6px 12px' }}>
              {isEditMode ? '設定完了' : 'ウィジェットを編集・追加'}
            </button>
          </div>
        </div>
      </div>

      {isEditMode && (
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>編集モード起動中</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>各ウィジェットの右上のアイコンから内容を編集できます。不要なものを非表示にしたり、新しく作成することも可能です。</p>
          </div>
          <button onClick={handleCreateWidget} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Plus size={16} /> ウィジェットを新規作成
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {widgets.filter(w => isEditMode || w.visible).map(widget => (
          <div key={widget.id} className="glass-panel" style={{ padding: '24px', position: 'relative', opacity: (!widget.visible && isEditMode) ? 0.5 : 1, border: isEditMode ? '2px dashed rgba(0,0,0,0.1)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditMode && <Grab size={20} color="var(--text-muted)" style={{ cursor: 'grab' }} />}
                {widget.title.includes('自分') ? widget.title.replace('自分', getTargetLabel()) : widget.title}
              </h2>

              {isEditMode && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveWidgets(widgets.map(w => w.id === widget.id ? { ...w, visible: !w.visible } : w))} className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: 'rgba(0,0,0,0.05)' }}>
                    {widget.visible ? '非表示にする' : '表示する'}
                  </button>
                  <button onClick={() => setEditingWidget(widget)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', gap: '4px' }}>
                    <Edit2 size={12} /> 編集
                  </button>
                  <button onClick={() => saveWidgets(widgets.filter(w => w.id !== widget.id))} className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--danger)', color: 'white' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
            
            {/* ウィジェットコンテンツ */}
            <div style={{ minHeight: '100px' }}>
              {renderWidgetContent(widget)}
            </div>
          </div>
        ))}
      </div>

      {/* 編集モーダル */}
      {editingWidget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '600px', maxWidth: '90%', padding: '32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>ウィジェットの編集</h2>
              <button onClick={() => setEditingWidget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>タイトル</label>
                <input value={editingWidget.title} onChange={e => setEditingWidget({...editingWidget, title: e.target.value})} className="form-input" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>ウィジェットタイプ</label>
                <select value={editingWidget.type} onChange={e => setEditingWidget({...editingWidget, type: e.target.value as any})} className="form-input">
                  <option value="MetricGrid">指標グリッド（パネル複数表示）</option>
                  <option value="Chart">単一データグラフ・数値表示</option>
                  <option value="MyActivityChart">行動履歴グラフ（固有機能）</option>
                  <option value="TaskProgress">タスク進捗（固有機能）</option>
                  <option value="ActivityTable">活動履歴テーブル（固有機能）</option>
                </select>
              </div>

              {editingWidget.type === 'MetricGrid' && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>表示する指標 (最大10個)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(METRIC_DICT).map(([key, info]) => {
                      const isSelected = editingWidget.gridMetrics?.includes(key);
                      return (
                        <button key={key} onClick={() => {
                            const gm = editingWidget.gridMetrics || [];
                            if (isSelected) setEditingWidget({...editingWidget, gridMetrics: gm.filter(k => k !== key)});
                            else setEditingWidget({...editingWidget, gridMetrics: [...gm, key]});
                          }}
                          style={{ padding: '6px 12px', borderRadius: '20px', border: isSelected ? '2px solid var(--primary)' : '1px solid #ccc', background: isSelected ? 'rgba(79,70,229,0.1)' : 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                          {info.label} {isSelected && '✓'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {editingWidget.type === 'Chart' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>表示形式</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label><input type="radio" checked={editingWidget.chartType === 'Line'} onChange={() => setEditingWidget({...editingWidget, chartType: 'Line'})} /> 折れ線グラフ (推移)</label>
                      <label><input type="radio" checked={editingWidget.chartType === 'Bar'} onChange={() => setEditingWidget({...editingWidget, chartType: 'Bar'})} /> 縦棒グラフ (比較)</label>
                      <label><input type="radio" checked={editingWidget.chartType === 'Numeric'} onChange={() => setEditingWidget({...editingWidget, chartType: 'Numeric'})} /> 合計数値のみ</label>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>表示するデータソース</label>
                    <select value={editingWidget.chartDataKey || '契約金額'} onChange={e => setEditingWidget({...editingWidget, chartDataKey: e.target.value})} className="form-input">
                      <option value="契約金額">契約金額 (会社全体)</option>
                      <option value="メンバー活動">活動スコア (会社全体)</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setEditingWidget(null)} className="btn">キャンセル</button>
              <button onClick={() => {
                saveWidgets(widgets.map(w => w.id === editingWidget.id ? editingWidget : w));
                setEditingWidget(null);
              }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> 保存して反映
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
