import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

import { ViewStateDocumentSync } from "@/components/app/view-state-document-sync";
import {
  DEFAULT_VIEW_LANGUAGE,
  normalizeViewLanguage,
} from "@/lib/view-state";

import "./globals.css";

export const metadata: Metadata = {
  title: "访行计划",
  description: "面向国内城市旅行的精细化 AI 行程规划工具。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const documentLanguage = normalizeViewLanguage(
    requestHeaders.get("x-visitors-lang"),
    DEFAULT_VIEW_LANGUAGE,
  );

  return (
    <html lang={documentLanguage} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ViewStateDocumentSync />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
