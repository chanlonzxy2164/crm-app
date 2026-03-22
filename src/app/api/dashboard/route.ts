import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'this_month';

    const now = new Date();
    let startDate = new Date(0);
    let endDate = now;

    if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'custom') {
      const customStart = searchParams.get('startDate');
      const customEnd = searchParams.get('endDate');
      if (customStart) startDate = new Date(customStart);
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // KPIサマリー系 (テナント絞り込み対応)
    const newCustomers = await prisma.customer.count({
      where: { companyId, createdAt: { gte: startDate, lte: endDate } }
    });

    const wonDeals = await prisma.deal.count({
      where: { companyId, stage: "WON", updatedAt: { gte: startDate, lte: endDate } }
    });

    const activeDeals = await prisma.deal.count({
      where: { companyId, stage: { notIn: ["WON", "LOST"] } } 
    });

    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: { companyId, stage: { notIn: ["WON", "LOST"] } },
      _count: { id: true },
      _sum: { amount: true }
    });

    const recentInteractionsCount = await prisma.interaction.count({
      where: { companyId, date: { gte: startDate, lte: endDate } }
    });

    const recentActivities = await prisma.interaction.findMany({
      where: { companyId },
      take: 5,
      orderBy: { date: 'desc' },
      include: { customer: true }
    });

    const completedTasks = await prisma.task.count({ where: { companyId, isCompleted: true } });
    const activeTasks = await prisma.task.count({ where: { companyId, isCompleted: false } });

    // チャート用データ（期間に応じて日別・月別にスケール変更）
    const allWonDeals = await prisma.deal.findMany({ 
      where: { companyId, stage: "WON", updatedAt: { gte: startDate, lte: endDate } } 
    });
    const allInteractions = await prisma.interaction.findMany({
      where: { companyId, date: { gte: startDate, lte: endDate } }
    });
    
    let chartData = [];
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
      // 期間が長い場合は月別推移 (最大直近12ヶ月) にする
      for(let i = 11; i >= 0; i--) {
        const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        
        const mDeals = allWonDeals.filter(x => {
            const ud = new Date(x.updatedAt);
            return ud >= mStart && ud <= mEnd;
        });
        const mAmount = mDeals.reduce((s, x) => s + x.amount, 0);
        const mInter = allInteractions.filter(x => {
            const ud = new Date(x.date);
            return ud >= mStart && ud <= mEnd;
        });
        
        // 取得範囲（startDate）よりも前なら表示しない
        if (mEnd < startDate && i !== 11) continue; 
        
        chartData.push({
            name: `${d.getFullYear()}/${d.getMonth()+1}`,
            契約金額: mAmount,
            メンバー活動: mInter.length * 5
        });
      }
    } else {
      // 期間が短い場合は日別推移にする (最大31日分)
      const daysToShow = Math.min(diffDays || 1, 31);
      const actualStartDate = new Date(endDate);
      actualStartDate.setDate(endDate.getDate() - daysToShow + 1);
      
      for (let i = 0; i < daysToShow; i++) {
        const targetDate = new Date(actualStartDate);
        targetDate.setDate(actualStartDate.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        const dayDeals = allWonDeals.filter(d => new Date(d.updatedAt).toISOString().split('T')[0] === dateStr);
        const dayAmount = dayDeals.reduce((sum, d) => sum + d.amount, 0);

        const dayInteractions = allInteractions.filter(inter => new Date(inter.date).toISOString().split('T')[0] === dateStr);
        
        chartData.push({
          name: `${targetDate.getMonth()+1}/${targetDate.getDate()}`,
          契約金額: dayAmount,
          メンバー活動: dayInteractions.length * 5 
        });
      }
    }

    return NextResponse.json({
      newCustomers,
      wonDeals,
      activeDeals,
      dealsByStage,
      recentInteractionsCount,
      recentActivities,
      taskProgress: {
        completed: completedTasks,
        active: activeTasks
      },
      chartData
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

