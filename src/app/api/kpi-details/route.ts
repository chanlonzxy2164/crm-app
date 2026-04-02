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

    const newCustomersList = await prisma.customer.findMany({
      where: { companyId, createdAt: { gte: startDate, lte: endDate } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const wonDealsList = await prisma.deal.findMany({
      where: { companyId, stage: "WON", updatedAt: { gte: startDate, lte: endDate } },
      include: { customer: { select: { lastName: true, firstName: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    const activeDealsList = await prisma.deal.findMany({
      where: { companyId, stage: { notIn: ["WON", "LOST"] } },
      include: { customer: { select: { lastName: true, firstName: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      newCustomersList,
      wonDealsList,
      activeDealsList
    });
  } catch (error) {
    console.error("KPI Details API Error:", error);
    return NextResponse.json({ error: "Failed to fetch KPI details" }, { status: 500 });
  }
}
