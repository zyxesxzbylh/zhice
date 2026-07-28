import type { Metadata, Viewport } from "next";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import ClientProviders from "@/components/ClientProviders";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TourProviderWrapper } from "@/components/TourProviderWrapper";

export const metadata: Metadata = {
  title: "执策",
  description: "轻量级项目协作工具 — 任务管理 + SOP 流程 + AI 智能拆分",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh antialiased" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-primary)' }}>
        <ErrorBoundary>
          <ClientProviders>
            <TourProviderWrapper>
              {children}
            </TourProviderWrapper>
          </ClientProviders>
        </ErrorBoundary>
        <ToasterProvider />
      </body>
    </html>
  );
}
