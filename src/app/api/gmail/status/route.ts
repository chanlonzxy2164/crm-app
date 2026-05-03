import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

/**
 * GET /api/gmail/status
 * 現在のユーザーのGmail接続状態を取得
 */
export async function GET(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'default_secret' });
  if (!token?.id) {
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  const gmailToken = await prisma.gmailToken.findUnique({
    where: { userId: token.id as string },
  });

  if (!gmailToken) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    gmailEmail: gmailToken.gmailEmail,
    connectedAt: gmailToken.createdAt,
    expiresAt: gmailToken.expiresAt,
  });
}

/**
 * DELETE /api/gmail/status
 * Gmail連携を解除
 */
export async function DELETE(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'default_secret' });
  if (!token?.id) {
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  await prisma.gmailToken.deleteMany({
    where: { userId: token.id as string },
  });

  // 関連するメールデータも削除
  await prisma.emailMessage.deleteMany({
    where: { userId: token.id as string },
  });

  return NextResponse.json({ success: true });
}
