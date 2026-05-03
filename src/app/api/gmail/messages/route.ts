import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

/**
 * GET /api/gmail/messages?customerId=xxx&page=1&limit=20
 * 同期済みメールを取得
 */
export async function GET(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'default_secret' });
  if (!token?.id) {
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const where: any = {
    userId: token.id as string,
  };

  if (customerId) {
    where.customerId = customerId;
  }

  const [messages, total] = await Promise.all([
    prisma.emailMessage.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
    }),
    prisma.emailMessage.count({ where }),
  ]);

  return NextResponse.json({
    messages,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
