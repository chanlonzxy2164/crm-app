import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Invalid data format or empty array" }, { status: 400 });
    }

    const customers = data.map((item: any) => ({
      lastName: item.lastName || "不明",
      firstName: item.firstName || "不明",
      companyName: item.companyName || null,
      email: item.email || null,
      phoneNumber: item.phoneNumber || null,
      status: "LEAD",
      companyId: session.user.companyId
    }));

    // createMany で一括登録を行う
    const result = await prisma.customer.createMany({
      data: customers,
    });

    return NextResponse.json({ success: true, count: result.count }, { status: 201 });
  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Failed to import customers" }, { status: 500 });
  }
}
