import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request, context: { params: Promise<{name: string}> | {name: string} }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const companyName = decodeURIComponent(params.name);
    
    const customers = await prisma.customer.findMany({
      // @ts-ignore
      where: { companyId: session.user.companyId, companyName },
      include: {
        deals: { orderBy: { createdAt: 'desc' } },
        interactions: { orderBy: { date: 'desc' }, take: 10 },
        user: { select: { id: true, name: true } }
      }
    });

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'Company not found or no associated customers' }, { status: 404 });
    }

    return NextResponse.json({
      companyName,
      customers
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch company details' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{name: string}> | {name: string} }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const companyName = decodeURIComponent(params.name);

    await prisma.customer.deleteMany({
      // @ts-ignore
      where: { companyId: session.user.companyId, companyName }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{name: string}> | {name: string} }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const companyName = decodeURIComponent(params.name);
    const { userId } = await request.json();

    await prisma.customer.updateMany({
      // @ts-ignore
      where: { companyId: session.user.companyId, companyName },
      data: { userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign user' }, { status: 500 });
  }
}
