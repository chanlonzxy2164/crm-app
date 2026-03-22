import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      where: { companyId: session.user.companyId },
      include: {
        deals: true,
        interactions: true
      }
    });

    // CSV Header
    let csvStr = "ID,姓,名,会社名,メール,電話番号,ステータス,最終連絡日,商談件数,商談合計額\n";

    customers.forEach((customer: any) => {
      const dealsCount = customer.deals?.length || 0;
      const dealsTotal = customer.deals?.reduce((sum: number, deal: any) => sum + (deal.amount || 0), 0) || 0;
      
      const row = [
        customer.id,
        customer.lastName,
        customer.firstName,
        customer.companyName || "",
        customer.email || "",
        customer.phoneNumber || "",
        customer.status,
        customer.lastContactAt ? new Date(customer.lastContactAt).toISOString().split('T')[0] : "",
        dealsCount,
        dealsTotal
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // CSV escaping
      
      csvStr += row + "\n";
    });

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="customers_report.csv"');

    return new NextResponse(csvStr, {
      status: 200,
      headers
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 });
  }
}

