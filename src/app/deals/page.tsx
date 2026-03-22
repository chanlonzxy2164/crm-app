"use client";
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash, Edit, DollarSign, Briefcase, Building2, ChevronDown, ListFilter, X, Search } from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string | null;
  createdAt: string;
  stageUpdatedAt: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
  };
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

const STAGES = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'WON', 'LOST'];
const STAGE_LABELS: Record<string, string> = {
  PROSPECTING: '発掘',
  QUALIFICATION: '評価',
  PROPOSAL: '提案',
  WON: '成約',
  LOST: '失注'
};

const STAGE_COLORS: Record<string, string> = {
  PROSPECTING: 'var(--primary)',
  QUALIFICATION: '#8b5cf6', // purple
  PROPOSAL: '#f59e0b', // amber
  WON: 'var(--success)',
  LOST: 'var(--danger)'
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', amount: '', stage: 'PROSPECTING', customerId: '', closeDate: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDeals();
    fetchCustomers();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      const data = await res.json();
      setDeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openNewForm = () => {
    setFormData({ name: '', amount: '', stage: 'PROSPECTING', customerId: '', closeDate: '' });
    setCustomerSearch('');
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (deal: Deal) => {
    setFormData({ 
      name: deal.name, 
      amount: deal.amount.toString(), 
      stage: deal.stage, 
      customerId: deal.customer.id,
      closeDate: deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : ''
    });
    setCustomerSearch(`${deal.customer.lastName} ${deal.customer.firstName}`);
    setEditingId(deal.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
        alert("入力候補から顧客を選択してください。");
        return;
    }
    setIsSubmitting(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/deals/${editingId}` : '/api/deals';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount), closeDate: formData.closeDate || undefined })
      });
      if (res.ok) {
        setIsFormOpen(false);
        fetchDeals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageChange = async (id: string, newStage: string) => {
    const previousDeals = [...deals];
    setDeals(deals.map(d => d.id === id ? { ...d, stage: newStage } : d));
    
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      if (!res.ok) throw new Error('Failed to update stage');
    } catch (err) {
      console.error(err);
      setDeals(previousDeals); // Revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この商談を削除してもよろしいですか？')) return;
    try {
      await fetch(`/api/deals/${id}`, { method: 'DELETE' });
      setDeals(deals.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  };

  const filteredCustomers = customers.filter(c => 
    `${c.lastName} ${c.firstName} ${c.companyName || ''}`.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={28} color="var(--primary)" /> 商談管理
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>取引の進行状況をカンバンボードで視覚的に管理</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={openNewForm} style={{ fontSize: '13px', padding: '6px 12px' }}>
            <Plus size={14} /> 新規作成
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '16px', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>{editingId ? '商談の編集' : '新規商談の作成'}</h2>
            <button onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>商談名</label>
                <input type="text" className="input-field" placeholder="（例）新規システム導入案件" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ padding: '8px 12px', fontSize: '13px' }}/>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>予想金額 (円)</label>
                <input type="number" className="input-field" placeholder="1000000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required min="0" style={{ padding: '8px 12px', fontSize: '13px' }}/>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0, position: 'relative' }} ref={dropdownRef}>
                <label className="form-label" style={{ fontSize: '12px' }}>関連する顧客</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="顧客名や会社名で検索..." 
                    value={customerSearch} 
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      setFormData({...formData, customerId: ''}); // 検索文字が変わったらIDをクリア
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    required
                    style={{ padding: '8px 12px', fontSize: '13px', paddingRight: '32px' }}
                  />
                  <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
                
                {/* カスタマー検索のドロップダウン */}
                {showCustomerDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--glass-border)' }}>
                    {filteredCustomers.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {filteredCustomers.map(c => (
                          <li 
                            key={c.id} 
                            style={{ padding: '10px 12px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                            onClick={() => {
                              setFormData({ ...formData, customerId: c.id });
                              setCustomerSearch(`${c.lastName} ${c.firstName}`);
                              setShowCustomerDropdown(false);
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(66, 153, 225, 0.1)')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span style={{ fontWeight: '600' }}>{c.lastName} {c.firstName}</span>
                            {c.companyName && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.companyName}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>一致する顧客が見つかりません</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>フェーズ</label>
                <select className="input-field" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} required style={{ padding: '8px 12px', fontSize: '13px' }}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>クローズ予定日</label>
                <input type="date" className="input-field" value={formData.closeDate} onChange={e => setFormData({...formData, closeDate: e.target.value})} style={{ padding: '8px 12px', fontSize: '13px' }}/>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ fontSize: '13px', padding: '6px 16px' }}>
                {isSubmitting ? '保存中...' : (editingId ? '更新する' : '追加する')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* カンバンボード風表示 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '12px', 
        paddingBottom: '16px', 
        paddingTop: '8px', 
        flex: 1, 
        minWidth: '800px', 
        overflowX: 'auto' 
      }}>
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            商談データを読み込んでいます...
          </div>
        ) : STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);

          return (
            <div key={stage} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px' }}>
              <div style={{ 
                padding: '12px', 
                background: 'rgba(255, 255, 255, 0.4)', 
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '12px', 
                borderTop: `4px solid ${STAGE_COLORS[stage]}`,
                marginBottom: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{STAGE_LABELS[stage]}</h3>
                  <span style={{ background: 'rgba(255,255,255,0.7)', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                    {stageDeals.length}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>
                  &yen;{totalAmount.toLocaleString()}
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '2px', paddingBottom: '20px' }} className="kanban-column">
                {stageDeals.map(deal => (
                  <div key={deal.id} className="glass-panel kanban-card" style={{ 
                    padding: '12px', 
                    background: 'rgba(255,255,255,0.85)', 
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'grab',
                    borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.3', wordBreak: 'break-word', paddingRight: '4px' }}>{deal.name}</h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '15px', fontWeight: '800', color: STAGE_COLORS[stage], display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' }}>
                        &yen;{deal.amount.toLocaleString()}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                        <Building2 size={10} color="var(--text-muted)" /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{deal.customer.lastName} {deal.customer.firstName}</span>
                      </p>
                    </div>

                    <div style={{ marginBottom: '12px', padding: '6px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                      {deal.closeDate && (
                        <div style={{ fontSize: '10px', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: 'bold' }}>
                          <span>クローズ予定日:</span>
                          <span>{formatDate(deal.closeDate)}</span>
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>発生日:</span>
                        <span>{formatDate(deal.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>ステータス変更:</span>
                        <span>{formatDate(deal.stageUpdatedAt)}</span>
                      </div>
                    </div>
                    
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <select 
                        value={deal.stage} 
                        onChange={(e) => handleStageChange(deal.id, e.target.value)}
                        className="input-field"
                        style={{ 
                          width: '100%', padding: '4px 8px', fontSize: '11px', fontWeight: '600',
                          backgroundColor: 'rgba(0,0,0,0.03)', border: 'none', appearance: 'none', cursor: 'pointer', borderRadius: '6px'
                        }}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                      </select>
                      <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
                      <button onClick={() => openEditForm(deal)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--primary)', fontSize: '11px', fontWeight: '600' }} title="編集">
                        <Edit size={12} /> 編集
                      </button>
                      <button onClick={() => handleDelete(deal.id)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--danger)', fontSize: '11px', fontWeight: '600' }} title="削除">
                        <Trash size={12} /> 削除
                      </button>
                    </div>
                  </div>
                ))}
                
                {stageDeals.length === 0 && (
                  <div style={{ padding: '20px 0', border: '2px dashed rgba(0,0,0,0.08)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    商談なし
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
