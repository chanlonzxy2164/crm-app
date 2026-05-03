import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getOAuth2Client } from '@/lib/gmail';
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

/**
 * GET /api/gmail/callback?code=xxx
 * Google OAuth コールバック。認証コードをトークンに交換してDBに保存。
 */
export async function GET(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'default_secret' });
  if (!token?.id) {
    // ログイン画面にリダイレクト
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/settings?gmail=error&reason=no_code', req.url));
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/settings?gmail=error&reason=no_token', req.url));
    }

    // Gmailアドレスを取得
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const gmailEmail = userInfo.data.email || '';

    // DBにトークンを保存 (upsert)
    await prisma.gmailToken.upsert({
      where: { userId: token.id as string },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        gmailEmail,
      },
      create: {
        userId: token.id as string,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        gmailEmail,
      },
    });

    return NextResponse.redirect(new URL('/settings?gmail=connected', req.url));
  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(new URL('/settings?gmail=error&reason=exchange_failed', req.url));
  }
}
