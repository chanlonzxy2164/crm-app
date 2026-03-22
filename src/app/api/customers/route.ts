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
      // @ts-ignore
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (data.email) {
      const existing = await prisma.customer.findFirst({
        // @ts-ignore
        where: { companyId: session.user.companyId, email: data.email }
      });
      if (existing) {
        return NextResponse.json({ error: 'このメールアドレスは既に他の顧客に登録されています。' }, { status: 400 });
      }
    }

    const newCustomer = await prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        // @ts-ignore
        companyId: session.user.companyId,
      }
    });
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}


