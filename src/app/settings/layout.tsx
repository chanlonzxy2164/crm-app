import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SettingsNav from "./SettingsNav";
import prisma from "@/lib/prisma";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  let role = session?.user?.role || 'MEMBER';
  if (!session?.user?.role && session?.user?.email) {
     const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
     if (dbUser) role = dbUser.role;
  }
  
  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: '28px' }}>
          設定
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          アカウント各種設定とチーム管理
        </p>
      </div>

      <SettingsNav role={role} />

      <div>
        {children}
      </div>
    </div>
  );
}
