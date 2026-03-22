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

    const deals = await prisma.deal.findMany({
      where: { companyId: session.user.companyId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(deals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const newDeal = await prisma.deal.create({
      data: {
        name: data.name,
        amount: Number(data.amount),
        stage: data.stage,
        customerId: data.customerId,
        companyId: session.user.companyId,
        userId: session.user.id,
        closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
        stageUpdatedAt: new Date()
      }
    });
    return NextResponse.json(newDeal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}

