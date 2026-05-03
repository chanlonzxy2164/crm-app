import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getGmailClient, createRawEmail } from '@/lib/gmail';
import prisma from '@/lib/prisma';

/**
 * POST /api/gmail/send
 * Gmailを使ってメールを送信
 * Body: { to: string, subject: string, body: string, customerId?: string }
 */
export async function POST(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'default_secret' });
  if (!token?.id) {
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  const gmailToken = await prisma.gmailToken.findUnique({
    where: { userId: token.id as string },
  });

  if (!gmailToken) {
    return NextResponse.json({ error: 'Gmailが接続されていません' }, { status: 400 });
  }

  const { to, subject, body, customerId } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: '宛先、件名、本文は必須です' }, { status: 400 });
  }

  try {
    const gmail = getGmailClient(gmailToken.accessToken, gmailToken.refreshToken);

    const raw = createRawEmail(to, gmailToken.gmailEmail, subject, body);

    const sentResult = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    // 送信したメールをDBにも保存
    if (sentResult.data.id) {
      await prisma.emailMessage.create({
        data: {
          gmailId: sentResult.data.id,
          threadId: sentResult.data.threadId || null,
          subject,
          from: gmailToken.gmailEmail,
          to,
          snippet: body.substring(0, 200),
          body,
          date: new Date(),
          isRead: true,
          labelIds: 'SENT',
          customerId: customerId || null,
          userId: token.id as string,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: sentResult.data.id,
      message: 'メールを送信しました' 
    });
  } catch (error: any) {
    console.error('Gmail send error:', error);
    
    if (error?.code === 401 || error?.response?.status === 401) {
      return NextResponse.json({ error: 'Gmailの認証が期限切れです。再接続してください。' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'メールの送信に失敗しました' }, { status: 500 });
  }
}
