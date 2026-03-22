"use client";
import { Download, TrendingUp, Users, Presentation } from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';

export default function ReportsPage() {
  const handleExportCSV = () => {
    // 顧客リストのCSVをダウンロード（Linkを用いたGETリクエストでダウンロードトリガー）
    window.open('/api/reports/export', '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>レポートと分析</h1>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} /> CSVエクスポート
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(66, 153, 225, 0.2) 0%, rgba(255,255,255,0.4) 100%)' }}>
          <p className="stat-title">顧客転換率</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p className="stat-value">24.5%</p>
            <TrendingUp size={24} color="var(--primary)"/>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>リードから顧客への転換</p>
        </div>

        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(255,255,255,0.4) 100%)' }}>
          <p className="stat-title">平均商談額</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p className="stat-value">142,000円</p>
            <Presentation size={24} color="var(--success)"/>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1件当たりの平均</p>
        </div>

        <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(237, 137, 54, 0.2) 0%, rgba(255,255,255,0.4) 100%)' }}>
          <p className="stat-title">アクティブ顧客</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p className="stat-value">128</p>
            <Users size={24} color="var(--warning)"/>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>過去30日以内のやり取り</p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <DashboardCharts />
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>レポートの説明</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          このページは試験的なモックデータを含んでいます。上部の「CSVエクスポート」ボタンをクリックすることで、現在の顧客データベース内の情報と、それに紐づく商談件数や合計金額が集計されたCSVファイルをダウンロードすることができます。
        </p>
      </div>

    </div>
  );
}
