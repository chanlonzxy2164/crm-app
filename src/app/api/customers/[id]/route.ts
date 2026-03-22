import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        interactions: { orderBy: { date: 'desc' } },
        deals: { orderBy: { createdAt: 'desc' } },
        user: { select: { id: true, name: true } },
      }
    });
    
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    // @ts-ignore
    if (customer.companyId && customer.companyId !== session.user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    // @ts-ignore
    if (customer.companyId && customer.companyId !== session.user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    const currentCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!currentCustomer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    // @ts-ignore
    if (currentCustomer.companyId && currentCustomer.companyId !== session.user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();

    if (data.email) {
      const existing = await prisma.customer.findFirst({
        // @ts-ignore
        where: { companyId: session.user.companyId, email: data.email, id: { not: id } }
      });
      if (existing) {
        return NextResponse.json({ error: 'このメールアドレスは既に他の顧客に登録されています。' }, { status: 400 });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}


