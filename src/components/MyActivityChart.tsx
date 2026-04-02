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

export default function MyActivityChart({ data }: { data?: any[] }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>自身の行動履歴 (推移)</h2>
      <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>データがありません。</p>
        )}
      </div>
    </div>
  );
}
