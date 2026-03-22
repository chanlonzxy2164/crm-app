import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    // @ts-ignore
    if (task.companyId && task.companyId !== session.user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        isCompleted: data.isCompleted,
        title: data.title,
      }
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    // @ts-ignore
    if (task.companyId && task.companyId !== session.user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

