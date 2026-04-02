"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function MyActivityChart({ data, compareStats, myStats, title = "行動履歴 (推移)" }: { data?: any[], compareStats?: any, myStats?: any, title?: string }) {
  const hasCompare = !!compareStats;

  const compareSummaryData = hasCompare ? [
    { name: '架電', '対象期間': myStats?.calls || 0, '比較期間': compareStats?.myStats?.calls || 0 },
    { name: 'メール', '対象期間': myStats?.emails || 0, '比較期間': compareStats?.myStats?.emails || 0 },
    { name: '商談', '対象期間': myStats?.appointments || 0, '比較期間': compareStats?.myStats?.appointments || 0 },
  ] : [];

  return (
    <div style={{ flex: 1 }}>
      {title && <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{title}</h2>}
      
      <div style={{ display: 'flex', gap: '24px', flexDirection: hasCompare ? 'row' : 'column' }}>
        {hasCompare && (
          <div style={{ flex: 1, height: '300px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>期間合計の比較</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareSummaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                <Legend />
                <Bar dataKey="対象期間" fill="var(--primary)" />
                <Bar dataKey="比較期間" fill="#9ca3af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ flex: hasCompare ? 1.5 : 1, height: '300px', display: 'flex', flexDirection: 'column' }}>
          {hasCompare && <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>時系列推移 (対象期間)</h3>}
          {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                <Legend />
                <Bar dataKey="架電" stackId="a" fill="var(--primary)" />
                <Bar dataKey="メール" stackId="a" fill="var(--secondary)" />
                <Bar dataKey="商談" stackId="a" fill="var(--success)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>データがありません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
