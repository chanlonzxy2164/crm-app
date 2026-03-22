"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Trash, Edit, Mail, Phone, Calendar, X, Building2, UserCircle, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  lastContactAt: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', companyName: '', email: '', phoneNumber: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal');

  // CSVインポート用の状態
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ firstName: '', lastName: '', companyName: '', email: '', phoneNumber: '' });
        setIsFormOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async (companyName: string) => {
    if (!confirm(`「${companyName}」とその所属担当者をすべて削除してもよろしいですか？`)) return;
    try {
      await fetch(`/api/client-companies/${encodeURIComponent(companyName)}`, { method: 'DELETE' });
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この顧客を削除してもよろしいですか？')) return;
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // CSVファイルの読み込みと簡易パース処理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length < 2) {
        alert('有効なデータがありません。ヘッダー（姓,名,会社名,メール,電話）を含めてください。');
        return;
      }

      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(',');
        parsedData.push({
          lastName: columns[0]?.trim() || '',
          firstName: columns[1]?.trim() || '',
          companyName: columns[2]?.trim() || '',
          email: columns[3]?.trim() || '',
          phoneNumber: columns[4]?.trim() || '',
        });
      }
      setImportData(parsedData);
      
      // 入力状態をリセット
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (importData.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      });
      if (res.ok) {
        setImportData([]);
        setIsImportModalOpen(false);
        fetchCustomers();
      } else {
        alert('インポートに失敗しました。');
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました。');
    } finally {
      setIsImporting(false);
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportData([]);
  };

  const getCompanyGroupedData = () => {
    const grouped = customers.reduce((acc, curr) => {
      const company = curr.companyName || '会社名未登録 (個人・その他)';
      if (!acc[company]) {
        acc[company] = { company, count: 0, customers: [] };
      }
      acc[company].count += 1;
      acc[company].customers.push(curr);
      return acc;
    }, {} as Record<string, { company: string, count: number, customers: Customer[] }>);

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  };

  const companyData = getCompanyGroupedData();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCircle size={28} color="var(--primary)" /> 顧客一覧
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>管理しているすべてのお客さま情報</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={() => setIsImportModalOpen(true)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={16} /> <span style={{ fontSize: '14px', fontWeight: 'bold' }}>CSVインポート</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> <span style={{ fontSize: '14px', fontWeight: 'bold' }}>新規登録</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => setActiveTab('personal')}
          style={{ 
            padding: '12px 24px', background: 'transparent', border: 'none', 
            borderBottom: activeTab === 'personal' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'personal' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'personal' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '14px'
          }}
        >
          担当顧客一覧
        </button>
        <button 
          onClick={() => setActiveTab('company')}
          style={{ 
            padding: '12px 24px', background: 'transparent', border: 'none', 
            borderBottom: activeTab === 'company' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'company' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'company' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '14px'
          }}
        >
          顧客会社一覧
        </button>
      </div>

      {isImportModalOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={closeImportModal}></div>
          <div className="glass-panel" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: '90%', maxWidth: '600px', padding: '32px', borderTop: '4px solid var(--primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={24} color="var(--primary)" /> 一括インポート
              </h2>
              <button onClick={closeImportModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            {importData.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', border: '2px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.5)' }}>
                <Upload size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p style={{ fontWeight: '600', marginBottom: '8px' }}>CSVファイルを選択してください</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
                  1行目はヘッダーとして無視されます。<br/>フォーマット: 姓, 名, 会社名, メールアドレス, 電話番号
                </p>
                <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} id="csv-upload" />
                <label htmlFor="csv-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  ファイルを選ぶ
                </label>
              </div>
            ) : (
              <div>
                <div style={{ background: 'rgba(72,187,120,0.1)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '24px' }}>
                  <CheckCircle2 size={20} />
                  <span style={{ fontWeight: '600' }}>{importData.length} 件のデータを読み込みました。</span>
                </div>
                
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>インポートのプレビュー (最初の5件)</h3>
                <div style={{ overflowX: 'auto', marginBottom: '24px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr><th>姓</th><th>名</th><th>会社名</th><th>連絡先</th></tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 5).map((d, i) => (
                        <tr key={i}>
                          <td>{d.lastName}</td><td>{d.firstName}</td><td>{d.companyName}</td><td><span style={{fontSize:'12px'}}>{d.email}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importData.length > 5 && <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.5)' }}>...他 {importData.length - 5}件</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => setImportData([])} className="btn" style={{ background: 'white' }}>キャンセルして選び直す</button>
                  <button onClick={executeImport} className="btn btn-primary" disabled={isImporting}>
                    {isImporting ? 'インポート中...' : `全 ${importData.length} 件を登録`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {isFormOpen && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>新規顧客の追加</h2>
            <button onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">姓</label>
                <input type="text" className="input-field" placeholder="山田" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">名</label>
                <input type="text" className="input-field" placeholder="太郎" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">会社名</label>
                <input type="text" className="input-field" placeholder="株式会社〇〇" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input type="email" className="input-field" placeholder="taro@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">電話番号</label>
                <input type="tel" className="input-field" placeholder="090-1234-5678" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存して追加'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ background: 'var(--glass-bg)', overflow: 'auto' }}>
        {activeTab === 'personal' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>担当者名</th>
                <th>会社名</th>
                <th>連絡先</th>
                <th>最終連絡日</th>
                <th>ステータス</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>データを読み込んでいます...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>顧客データがありません。右上のボタンから追加してください。</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{c.lastName} {c.firstName}</td>
                    <td>
                      {c.companyName ? (
                        <Link href={`/client-companies/${encodeURIComponent(c.companyName)}`} style={{ textDecoration: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-main)' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}>
                            <Building2 size={14} color="var(--primary)"/>
                            <span>{c.companyName}</span>
                          </div>
                        </Link>
                      ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Mail size={14} color="var(--primary)"/> {c.email}</div>}
                        {c.phoneNumber && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Phone size={14} color="var(--success)"/> {c.phoneNumber}</div>}
                        {!c.email && !c.phoneNumber && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>登録なし</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <Calendar size={14}/> {c.lastContactAt ? new Date(c.lastContactAt).toLocaleDateString() : '未連絡'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'ACTIVE' ? 'badge-active' : 'badge-lead'}`}>
                        {c.status === 'ACTIVE' ? '顧客' : '見込み'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link href={`/customers/${c.id}`} className="btn" style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center' }}>
                          詳細
                        </Link>
                        <button onClick={() => handleDelete(c.id)} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: '6px' }}>
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>会社名</th>
                <th>登録担当者数</th>
                <th>最新連絡日</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>データを読み込んでいます...</td></tr>
              ) : companyData.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>データがありません。</td></tr>
              ) : (
                companyData.map((data, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="var(--primary)"/>
                        {data.company !== '会社名未登録 (個人・その他)' ? (
                          <Link href={`/client-companies/${encodeURIComponent(data.company)}`} style={{ textDecoration: 'none', color: 'var(--text-main)' }}>
                            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}>
                              {data.company}
                            </span>
                          </Link>
                        ) : (
                          <span>{data.company}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-active">{data.count} 名</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500' }}>
                        {(() => {
                          const dates = data.customers.map(c => c.lastContactAt ? new Date(c.lastContactAt).getTime() : 0).filter(d => d > 0);
                          if (dates.length === 0) return <span style={{color: 'var(--text-muted)'}}>未連絡</span>;
                          return new Date(Math.max(...dates)).toLocaleDateString();
                        })()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {data.company !== '会社名未登録 (個人・その他)' && (
                          <Link href={`/client-companies/${encodeURIComponent(data.company)}`} className="btn" style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center' }}>
                            詳細
                          </Link>
                        )}
                        {data.company !== '会社名未登録 (個人・その他)' && (
                          <button onClick={() => handleDeleteCompany(data.company)} className="icon-btn" title="企業情報を削除" style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: '6px' }}>
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
