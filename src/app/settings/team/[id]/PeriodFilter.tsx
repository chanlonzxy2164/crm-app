"use client";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function PeriodFilter({ currentPeriod, customStart, customEnd }: { currentPeriod: string, customStart: string, customEnd: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('period', e.target.value);
    
    // reset dates if switching away from custom
    if (e.target.value !== 'custom') {
      params.delete('start');
      params.delete('end');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const updateCustomDates = (start: string, end: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('period', 'custom');
    if (start) params.set('start', start); else params.delete('start');
    if (end) params.set('end', end); else params.delete('end');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <select 
        name="period" 
        value={currentPeriod} 
        onChange={handlePeriodChange} 
        style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', cursor: 'pointer' }}
      >
        <option value="all">全期間</option>
        <option value="this_month">今月</option>
        <option value="last_month">先月</option>
        <option value="this_year">今年</option>
        <option value="custom">カスタム（期間指定）</option>
      </select>
      
      {currentPeriod === 'custom' && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <input 
            type="date" 
            value={customStart} 
            onChange={e => updateCustomDates(e.target.value, customEnd)}
            style={{ fontSize: '12px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'white' }}
          />
          <span style={{ fontSize: '12px' }}>〜</span>
          <input 
            type="date" 
            value={customEnd} 
            onChange={e => updateCustomDates(customStart, e.target.value)}
            style={{ fontSize: '12px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'white' }}
          />
        </div>
      )}
    </div>
  );
}
