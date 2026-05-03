import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthUrl } from '@/lib/gmail';
import prisma from '@/lib/prisma';

/**
 * GET /api/gmail/auth
 * Gmail OAuth認証URLを生成して返す
 */
export async function GET(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'default_secret' });
  if (!token?.id) {
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  const authUrl = getAuthUrl();
  return NextResponse.json({ authUrl });
}
