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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ customers: [], deals: [], tasks: [] });
    }

    const companyId = session.user.companyId;

    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { companyName: { contains: query } },
          { email: { contains: query } },
          { phoneNumber: { contains: query } }
        ]
      },
      take: 10
    });

    const deals = await prisma.deal.findMany({
      where: {
        companyId,
        name: { contains: query }
      },
      include: { customer: true },
      take: 10
    });

    const tasks = await prisma.task.findMany({
      where: {
        companyId,
        title: { contains: query }
      },
      take: 10
    });

    return NextResponse.json({
      customers,
      deals,
      tasks
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
