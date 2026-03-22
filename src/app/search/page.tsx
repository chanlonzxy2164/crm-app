"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, Users, Briefcase, CheckSquare } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  
  const [results, setResults] = useState<{ customers: any[], deals: any[], tasks: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setResults({ customers: [], deals: [], tasks: [] });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [query]);

  if (!query) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <SearchIcon size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
        検索キーワードを入力してください
      </div>
    );
  }

  const STAGE_LABELS: Record<string, string> = {
    PROSPECTING: '発掘', QUALIFICATION: '評価', PROPOSAL: '提案', WON: '成約', LOST: '失注'
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SearchIcon size={28} color="var(--primary)" /> 「{query}」の検索結果
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          {isLoading ? '検索中...' : `顧客 ${results?.customers.length || 0}件、商談 ${results?.deals.length || 0}件、タスク ${results?.tasks.length || 0}件`}
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>読み込み中...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Customers */}
          <section className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary)" /> 顧客
            </h2>
            {results?.customers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>一致する顧客は見つかりませんでした。</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {results?.customers.map(c => (
                  <Link href={`/customers/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '16px', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'white'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{c.lastName} {c.firstName}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {c.companyName && <span style={{ marginRight: '8px' }}>🏢 {c.companyName}</span>}
                          {c.email && <span>✉️ {c.email}</span>}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Deals */}
          <section className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--primary)" /> 商談
            </h2>
            {results?.deals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>一致する商談は見つかりませんでした。</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {results?.deals.map(d => (
                  <div key={d.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{d.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>顧客: {d.customer?.lastName} {d.customer?.firstName}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>&yen;{d.amount.toLocaleString()}</p>
                      <span className="badge" style={{ marginTop: '4px', display: 'inline-block' }}>{STAGE_LABELS[d.stage] || d.stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tasks */}
          <section className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={20} color="var(--primary)" /> タスク
            </h2>
            {results?.tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>一致するタスクは見つかりませんでした。</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {results?.tasks.map(t => (
                  <div key={t.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{t.title}</p>
                    {t.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{t.description}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <span className={`badge ${t.isCompleted ? 'badge-active' : 'badge-lead'}`} style={{ color: t.isCompleted ? 'var(--success)' : 'var(--warning)', border: `1px solid ${t.isCompleted ? 'var(--success)' : 'var(--warning)'}`, background: 'transparent' }}>
                        {t.isCompleted ? '完了' : '未完了'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>検索情報を読み込み中...</div>}>
      <SearchContent />
    </Suspense>
  );
}
