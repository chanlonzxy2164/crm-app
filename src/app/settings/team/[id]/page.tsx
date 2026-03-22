import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Briefcase, Activity, Target } from "lucide-react";
import UserEditForm from "./UserEditForm";
import PeriodFilter from "./PeriodFilter";

export default async function UserDetailPage({ params, searchParams }: { params: Promise<{ id: string }> | { id: string }, searchParams: Promise<any> | any }) {
  const session = await getServerSession(authOptions);
  
  // admin check fallback
  let isAdmin = session?.user?.role === 'ADMIN';
  if (!isAdmin && session?.user?.email) {
     const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
     if (dbUser?.role === 'ADMIN') isAdmin = true;
  }
  if (!session || !isAdmin) {
    redirect('/settings');
  }

  const { id } = await params;
  const sp = await searchParams;
  const period = sp?.period || 'all';
  const customStart = sp?.start || '';
  const customEnd = sp?.end || '';
  
  const user = await prisma.user.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      customers: { select: { id: true, lastName: true, firstName: true, companyName: true } },
      deals: { select: { id: true, name: true, amount: true, stage: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } },
      interactions: { select: { id: true, type: true, date: true, notes: true, customer: { select: { lastName: true, companyName: true } } }, orderBy: { date: 'desc' }, take: 20 }
    }
  });

  if (!user) {
    return <div>ユーザーが見つかりません。</div>;
  }

  // period filtering
  const now = new Date();
  let startDate = new Date(0);
  let endDate = new Date(9999, 11, 31, 23, 59, 59);

  if (period === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === 'last_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (period === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else if (period === 'custom') {
    if (customStart) startDate = new Date(`${customStart}T00:00:00`);
    if (customEnd) endDate = new Date(`${customEnd}T23:59:59`);
  }

  const wonDeals = user.deals.filter(d => 
    d.stage === 'WON' && new Date(d.updatedAt) >= startDate && new Date(d.updatedAt) <= endDate
  );

  const wonAmount = wonDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <Link href="/settings/team" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px', fontSize: '14px' }}>
        <ArrowLeft size={16} /> チーム管理へ戻る
      </Link>

      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <User size={48} color="var(--primary)" />
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{user.email} ・ {user.role === 'ADMIN' ? '管理者' : 'メンバー'}</p>
          </div>
        </div>
        <UserEditForm user={user} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} color="var(--primary)" /> 担当顧客 ({user.customers.length}名)
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user.customers.length === 0 ? <li style={{ color: 'var(--text-muted)' }}>担当顧客はいません</li> : 
             user.customers.slice(0, 10).map(c => (
               <li key={c.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'rgba(255,255,255,0.4)', borderRadius: '6px' }}>
                 <span style={{ fontWeight: '500' }}>{c.lastName} {c.firstName}</span>
                 {c.companyName && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.companyName}</span>}
               </li>
             ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Target size={18} color="var(--primary)" /> 成約した商談 (&yen;{wonAmount.toLocaleString()})
            </h3>
            <PeriodFilter currentPeriod={period} customStart={customStart} customEnd={customEnd} />
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {wonDeals.length === 0 ? <li style={{ color: 'var(--text-muted)' }}>指定期間の成約はありません</li> : 
             wonDeals.map(d => (
               <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.4)', borderRadius: '6px' }}>
                 <span style={{ fontWeight: '500' }}>{d.name} <span style={{fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px'}}>{new Date(d.updatedAt).toLocaleDateString()}</span></span>
                 <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>&yen;{d.amount.toLocaleString()}</span>
               </li>
             ))}
          </ul>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary)" /> 最近の活動履歴
        </h3>
        {user.interactions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>活動履歴がありません</p> : 
         <table className="data-table">
           <thead><tr><th>日時</th><th>対象顧客</th><th>種類</th><th>メモ</th></tr></thead>
           <tbody>
             {user.interactions.map(i => (
               <tr key={i.id}>
                 <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(i.date).toLocaleDateString()}</td>
                 <td style={{ fontSize: '14px', fontWeight: '500' }}>{i.customer.companyName} {i.customer.lastName}</td>
                 <td style={{ fontSize: '13px' }}><span className="badge">{i.type}</span></td>
                 <td style={{ fontSize: '13px' }}>{i.notes}</td>
               </tr>
             ))}
           </tbody>
         </table>
        }
      </div>
    </div>
  );
}
