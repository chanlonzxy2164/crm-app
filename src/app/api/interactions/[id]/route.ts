import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request: Request, context: { params: Promise<{id: string}> | {id: string} }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const interactionId = params.id;
    const data = await request.json();

    const interaction = await prisma.interaction.findUnique({ where: { id: interactionId } });
    if (!interaction) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // @ts-ignore
    if (interaction.companyId !== session.user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await prisma.interaction.update({
      where: { id: interactionId },
      data: {
        type: data.type !== undefined ? data.type : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        userId: data.userId !== undefined ? data.userId : undefined,
        customerId: data.customerId !== undefined ? data.customerId : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update interaction' }, { status: 500 });
  }
}
