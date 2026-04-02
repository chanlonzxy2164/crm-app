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
    const userId = session.user.id;

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'this_month';
    const targetUser = searchParams.get('targetUser');
    const targetUserId = targetUser && targetUser !== 'all' ? targetUser : userId;
    const isCompanyWideStats = targetUser === 'all';
    
    const compareMode = searchParams.get('compareMode') || 'none';

    // チームメンバー一覧を取得（フロントエンドのドロップダウン用）
    const teamMembers = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true }
    });

    const getPeriodDates = (p: string, customStart?: string | null, customEnd?: string | null) => {
      const now = new Date();
      let start = new Date(0);
      let end = now;

      if (p === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (p === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      } else if (p === 'this_year') {
        start = new Date(now.getFullYear(), 0, 1);
      } else if (p === 'custom') {
        if (customStart) start = new Date(customStart);
        if (customEnd) {
          end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
        }
      }
      return { start, end };
    };

    const { start: startDate, end: endDate } = getPeriodDates(period, searchParams.get('startDate'), searchParams.get('endDate'));

    // 比較期間の計算
    let compStartDate = new Date(0);
    let compEndDate = new Date(0);
    let hasCompare = false;

    if (compareMode === 'previous_year') {
      compStartDate = new Date(startDate);
      compStartDate.setFullYear(compStartDate.getFullYear() - 1);
      compEndDate = new Date(endDate);
      compEndDate.setFullYear(compEndDate.getFullYear() - 1);
      hasCompare = true;
    } else if (compareMode === 'previous_period') {
      const diffTime = endDate.getTime() - startDate.getTime();
      compEndDate = new Date(startDate.getTime() - 1);
      compStartDate = new Date(compEndDate.getTime() - diffTime);
      hasCompare = true;
    } else if (compareMode === 'custom') {
      const cStart = searchParams.get('compStartDate');
      const cEnd = searchParams.get('compEndDate');
      if (cStart && cEnd) {
        compStartDate = new Date(cStart);
        compEndDate = new Date(cEnd);
        compEndDate.setHours(23, 59, 59, 999);
        hasCompare = true;
      }
    }

    // データ取得のためのヘルパー（メイン期間と比較期間で再利用）
    const fetchStats = async (start: Date, end: Date) => {
      const newCust = await prisma.customer.count({ where: { companyId, createdAt: { gte: start, lte: end } } });
      const won = await prisma.deal.count({ where: { companyId, stage: "WON", updatedAt: { gte: start, lte: end } } });
      const active = await prisma.deal.count({ where: { companyId, stage: { notIn: ["WON", "LOST"] }, createdAt: { lte: end } } });
      const interactions = await prisma.interaction.count({ where: { companyId, date: { gte: start, lte: end } } });

      const filterMy = isCompanyWideStats ? {} : { userId: targetUserId };
      
      const myWon = await prisma.deal.count({ where: { ...filterMy, companyId, stage: "WON", updatedAt: { gte: start, lte: end } } });
      const myCreated = await prisma.deal.count({ where: { ...filterMy, companyId, createdAt: { gte: start, lte: end } } });
      const myAppts = await prisma.interaction.count({ where: { ...filterMy, companyId, type: "MEETING", date: { gte: start, lte: end } } });
      const myCalls = await prisma.interaction.count({ where: { ...filterMy, companyId, type: "CALL", date: { gte: start, lte: end } } });
      const myEmails = await prisma.interaction.count({ where: { ...filterMy, companyId, type: "EMAIL", date: { gte: start, lte: end } } });
      
      return {
        newCustomers: newCust, wonDeals: won, activeDeals: active, recentInteractionsCount: interactions,
        myStats: { contracts: myWon, opportunities: myCreated, appointments: myAppts, calls: myCalls, emails: myEmails }
      };
    };

    const currentStats = await fetchStats(startDate, endDate);
    const compareStats = hasCompare ? await fetchStats(compStartDate, compEndDate) : null;

    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'], where: { companyId, stage: { notIn: ["WON", "LOST"] } },
      _count: { id: true }, _sum: { amount: true }
    });

    const recentActivities = await prisma.interaction.findMany({
      where: { companyId }, take: 5, orderBy: { date: 'desc' }, include: { customer: true }
    });

    const completedTasks = await prisma.task.count({ where: { companyId, isCompleted: true } });
    const activeTasks = await prisma.task.count({ where: { companyId, isCompleted: false } });

    // チャート用データ生成関数
    const generateChartData = async (start: Date, end: Date) => {
      const allWonDeals = await prisma.deal.findMany({ where: { companyId, stage: "WON", updatedAt: { gte: start, lte: end } } });
      const allInteractions = await prisma.interaction.findMany({ where: { companyId, date: { gte: start, lte: end } } });
      
      const filterMy = isCompanyWideStats ? {} : { userId: targetUserId };
      const myInteractions = await prisma.interaction.findMany({ where: { ...filterMy, companyId, date: { gte: start, lte: end } } });

      let chartData = [];
      let myActData = [];
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 60) {
        for(let i = 11; i >= 0; i--) {
          const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
          const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
          const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
          if (mEnd < start && i !== 11) continue; 
          
          const mDeals = allWonDeals.filter(x => new Date(x.updatedAt) >= mStart && new Date(x.updatedAt) <= mEnd);
          const mInter = allInteractions.filter(x => new Date(x.date) >= mStart && new Date(x.date) <= mEnd);
          chartData.push({ name: `${d.getFullYear()}/${d.getMonth()+1}`, 契約金額: mDeals.reduce((s, x) => s + x.amount, 0), メンバー活動: mInter.length * 5 });

          const myInter = myInteractions.filter(x => new Date(x.date) >= mStart && new Date(x.date) <= mEnd);
          myActData.push({
            name: `${d.getFullYear()}/${d.getMonth()+1}`,
            架電: myInter.filter(x => x.type === 'CALL').length,
            メール: myInter.filter(x => x.type === 'EMAIL').length,
            商談: myInter.filter(x => x.type === 'MEETING').length,
            合計: myInter.length,
          });
        }
      } else {
        const daysToShow = Math.min(diffDays || 1, 31);
        const actStart = new Date(end); actStart.setDate(end.getDate() - daysToShow + 1);
        for (let i = 0; i < daysToShow; i++) {
          const tDate = new Date(actStart); tDate.setDate(actStart.getDate() + i);
          const dateStr = tDate.toISOString().split('T')[0];
          
          const dayDeals = allWonDeals.filter(d => new Date(d.updatedAt).toISOString().split('T')[0] === dateStr);
          const dayInter = allInteractions.filter(inter => new Date(inter.date).toISOString().split('T')[0] === dateStr);
          chartData.push({ name: `${tDate.getMonth()+1}/${tDate.getDate()}`, 契約金額: dayDeals.reduce((sum, d) => sum + d.amount, 0), メンバー活動: dayInter.length * 5 });

          const myDayInter = myInteractions.filter(inter => new Date(inter.date).toISOString().split('T')[0] === dateStr);
          myActData.push({
            name: `${tDate.getMonth()+1}/${tDate.getDate()}`,
            架電: myDayInter.filter(x => x.type === 'CALL').length,
            メール: myDayInter.filter(x => x.type === 'EMAIL').length,
            商談: myDayInter.filter(x => x.type === 'MEETING').length,
            合計: myDayInter.length,
          });
        }
      }
      return { chartData, myActivityChartData: myActData };
    };

    const charts = await generateChartData(startDate, endDate);
    const compareCharts = hasCompare ? await generateChartData(compStartDate, compEndDate) : null;

    // zip the compareChartData into the main chartData
    const zippedChartData = charts.chartData.map((d: any, index: number) => {
      const copy = { ...d };
      if (compareCharts && compareCharts.chartData[index]) {
        copy['契約金額 (比較)'] = compareCharts.chartData[index].契約金額;
        copy['メンバー活動 (比較)'] = compareCharts.chartData[index].メンバー活動;
      }
      return copy;
    });

    return NextResponse.json({
      ...currentStats,
      compareStats,
      dealsByStage,
      recentActivities,
      taskProgress: { completed: completedTasks, active: activeTasks },
      chartData: zippedChartData,
      myActivityChartData: charts.myActivityChartData,
      compareChartData: compareCharts ? compareCharts.chartData : undefined,
      teamMembers,
      targetUserId,
      isCompanyWideStats
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
