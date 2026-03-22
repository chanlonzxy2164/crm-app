import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { companyId: session.user.companyId },
      include: {
        deals: { where: { stage: 'WON' }, select: { amount: true } },
        interactions: { select: { id: true } },
        _count: {
          select: { customers: true, tasks: true }
        }
      }
    });

    const formattedUsers = users.map((u: any) => {
      const wonAmount = u.deals.reduce((sum: number, d: any) => sum + d.amount, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        wonAmount,
        interactionCount: u.interactions.length,
        customerCount: u._count.customers,
        taskCount: u._count.tasks
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, role } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "This email is already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "MEMBER",
        companyId: session.user.companyId,
      }
    });

    return NextResponse.json({ id: newUser.id, email: newUser.email, name: newUser.name }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
