"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function DashboardCharts({ taskProgress, chartData, dealsByStage }: { taskProgress?: { completed: number, active: number }, chartData?: any[], dealsByStage?: { stage: string, _count: { id: number }, _sum: { amount: number | null } }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>今月の契約金額 (推移)</h2>
        <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                <Line type="monotone" dataKey="契約金額" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                {chartData[0] && chartData[0]['契約金額 (比較)'] !== undefined && (
                  <Line type="monotone" dataKey="契約金額 (比較)" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>グラフデータがありません。商談を追加してください。</p>
          )}
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>タスク進捗</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>完了</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{taskProgress?.completed || 0} <span style={{fontSize: '14px', color: 'var(--success)'}}>タスク</span></p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>進行中</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{taskProgress?.active || 0} <span style={{fontSize: '14px', color: 'var(--warning)'}}>タスク</span></p>
          </div>
        </div>

        {dealsByStage && dealsByStage.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-muted)' }}>進行中の商談フェーズ内訳</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dealsByStage.map(d => (
                <div key={d.stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>{
                    d.stage === 'PROSPECTING' ? '発掘' :
                    d.stage === 'QUALIFICATION' ? '評価' :
                    d.stage === 'PROPOSAL' ? '提案' : d.stage
                  }</span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{d._count.id}件</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
