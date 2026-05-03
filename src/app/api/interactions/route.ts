import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    // @ts-ignore
    if (customer.companyId && customer.companyId !== session.user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const newInteraction = await prisma.interaction.create({
      data: {
        type: data.type,
        notes: data.notes,
        customerId: data.customerId,
        companyId: session.user.companyId,
        userId: data.userId || session.user.id,
      }
    });

    // 顧客の最終連絡日を更新する
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { lastContactAt: new Date() }
    });

    return NextResponse.json(newInteraction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
  }
}

