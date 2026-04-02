"use client";
import { useState, useEffect } from 'react';
import { Plus, Trash, CheckCircle, Circle, CheckSquare, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.error('Expected array, got:', data);
        setTasks([]);
      }
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
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ title: '', description: '' });
        setIsFormOpen(false);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompleted = async (task: Task) => {
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t);
    setTasks(updatedTasks);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このタスクを削除してもよろしいですか？')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={28} color="var(--primary)" /> タスク管理
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>個人のToDoや期限のある作業をチェック</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus size={16} /> タスクを追加
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>進捗 ({completedCount}/{tasks.length})</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #8b5cf6)', transition: 'width 0.4s ease' }}></div>
        </div>
      </div>

      {isFormOpen && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>新規タスク</h2>
            <button onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">タスク名</label>
              <input type="text" className="input-field" placeholder="（例）A社に提案書をメールする" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">詳細・メモ (任意)</label>
              <textarea className="input-field" placeholder="見積もりの変更箇所に注意..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? '保存中...' : '追加する'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.4)', padding: '24px', minHeight: '400px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>タスクを読み込んでいます...</div>
        ) : tasks.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <CheckSquare size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontWeight: '500', fontSize: '15px' }}>タスクがありません</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>右上の「追加」ボタンから新しいタスクを作成してください。</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 未完了タスク */}
            {tasks.filter(t => !t.isCompleted).map(task => (
              <div key={task.id} className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.85)', borderRadius: '12px', borderLeft: '4px solid #f59e0b', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <button onClick={() => handleToggleCompleted(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: '2px', transition: 'color 0.2s' }} aria-label="完了にする">
                    <Circle size={24} />
                  </button>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', lineHeight: '1.4' }}>{task.title}</h3>
                    {task.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{task.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(task.id)} className="icon-btn" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', padding: '8px', boxShadow: 'none' }}><Trash size={16}/></button>
              </div>
            ))}

            {/* 完了済みタスク */}
            {tasks.filter(t => t.isCompleted).length > 0 && (
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginTop: '16px', marginBottom: '8px', paddingLeft: '8px' }}>完了済み</h3>
            )}
            
            {tasks.filter(t => t.isCompleted).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', borderLeft: '4px solid var(--success)', opacity: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => handleToggleCompleted(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }}>
                    <CheckCircle size={24} />
                  </button>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{task.title}</h3>
                </div>
                <button onClick={() => handleDelete(task.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(229,62,62,0.6)' }}><Trash size={16}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
