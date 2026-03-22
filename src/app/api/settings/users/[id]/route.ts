import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest, context: { params: Promise<{id: string}> | {id: string} }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (!session.user.role && session.user.email)) {
      // old session fallback
      const dbUser = await prisma.user.findUnique({ where: { email: session!.user.email! }});
      if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const updates = await request.json();
    
    const userToEdit = await prisma.user.findUnique({ where: { id, companyId: session.user.companyId } });
    if (!userToEdit) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data: any = {};
    if (updates.name) data.name = updates.name;
    if (updates.email) {
      if (updates.email !== userToEdit.email) {
        const exist = await prisma.user.findUnique({ where: { email: updates.email } });
        if (exist) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        data.email = updates.email;
      }
    }
    if (updates.role) data.role = updates.role;
    if (updates.password) {
      data.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, user: { id: updatedUser.id, name: updatedUser.name } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
