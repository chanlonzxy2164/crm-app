import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    
    // 現在の商談を取得してステージ変更をチェック
    const currentDeal = await prisma.deal.findUnique({ where: { id } });
    
    if (!currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    
    // @ts-ignore
    if (currentDeal.companyId && currentDeal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {
      name: data.name,
      amount: data.amount ? Number(data.amount) : undefined,
      stage: data.stage,
    };
    if (data.closeDate !== undefined) {
       updateData.closeDate = data.closeDate ? new Date(data.closeDate) : null;
    }
    
    if (currentDeal && data.stage && currentDeal.stage !== data.stage) {
      updateData.stageUpdatedAt = new Date();
      if ((data.stage === 'WON' || data.stage === 'LOST') && !updateData.closeDate) {
        updateData.closeDate = new Date();
      }
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const currentDeal = await prisma.deal.findUnique({ where: { id } });
    
    if (!currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    
    // @ts-ignore
    if (currentDeal.companyId && currentDeal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.deal.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
