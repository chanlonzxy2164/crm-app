import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/Providers";
import AppLayout from "@/components/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM Plus | ガラスモーフィズム",
  description: "Next.js と Prisma で構築されたモダンなCRMツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <NextAuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </NextAuthProvider>
      </body>
    </html>
  );
}
