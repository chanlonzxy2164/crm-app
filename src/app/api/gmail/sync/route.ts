import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getGmailClient, extractPlainTextBody, getHeader } from '@/lib/gmail';
import prisma from '@/lib/prisma';

/**
 * POST /api/gmail/sync
 * Gmail から顧客に紐づくメールを同期
 * Body: { customerId?: string } — 特定の顧客のみ同期する場合
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

  const body = await req.json().catch(() => ({}));
  const { customerId } = body;

  try {
    const gmail = getGmailClient(gmailToken.accessToken, gmailToken.refreshToken);

    // 同期対象の顧客メールアドレスを取得
    let customerEmails: { id: string; email: string }[] = [];
    
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, email: true },
      });
      if (customer?.email) {
        customerEmails = [{ id: customer.id, email: customer.email }];
      }
    } else {
      // 全顧客のメールアドレスを取得（自社のみ）
      const customers = await prisma.customer.findMany({
        where: { 
          companyId: token.companyId as string,
          email: { not: null },
        },
        select: { id: true, email: true },
      });
      customerEmails = customers
        .filter((c): c is { id: string; email: string } => !!c.email);
    }

    if (customerEmails.length === 0) {
      return NextResponse.json({ synced: 0, message: '同期対象のメールアドレスがありません' });
    }

    let totalSynced = 0;

    for (const { id: custId, email } of customerEmails) {
      try {
        // Gmailで該当メールアドレスとの送受信を検索
        const query = `from:${email} OR to:${email}`;
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 20, // 各顧客ごとに最新20件
        });

        const messages = listRes.data.messages || [];

        for (const msg of messages) {
          if (!msg.id) continue;

          // 既に同期済みかチェック
          const existing = await prisma.emailMessage.findUnique({
            where: { gmailId: msg.id },
          });
          if (existing) continue;

          // メールの詳細を取得
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
          });

          const headers = detail.data.payload?.headers || [];
          const subject = getHeader(headers, 'Subject');
          const from = getHeader(headers, 'From');
          const to = getHeader(headers, 'To');
          const dateStr = getHeader(headers, 'Date');
          const date = dateStr ? new Date(dateStr) : new Date();
          const snippet = detail.data.snippet || '';
          const body = extractPlainTextBody(detail.data.payload) || snippet;
          const labelIds = (detail.data.labelIds || []).join(',');
          const isRead = !(detail.data.labelIds || []).includes('UNREAD');

          await prisma.emailMessage.create({
            data: {
              gmailId: msg.id,
              threadId: detail.data.threadId || null,
              subject,
              from,
              to,
              snippet,
              body,
              date,
              isRead,
              labelIds,
              customerId: custId,
              userId: token.id as string,
            },
          });

          totalSynced++;
        }
      } catch (emailError) {
        console.error(`Error syncing emails for ${email}:`, emailError);
        // 個々のメールのエラーは無視して次へ
      }
    }

    return NextResponse.json({ synced: totalSynced, message: `${totalSynced}件のメールを同期しました` });
  } catch (error: any) {
    console.error('Gmail sync error:', error);
    
    // トークン期限切れの場合
    if (error?.code === 401 || error?.response?.status === 401) {
      return NextResponse.json({ error: 'Gmailの認証が期限切れです。再接続してください。' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'メールの同期に失敗しました' }, { status: 500 });
  }
}
