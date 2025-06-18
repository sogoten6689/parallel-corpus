'use client';
import './i18n/config';
// import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AppLayout from "@/components/ui/app-layout";
import ThemeProvider from "./theme-provider";
import ReduxProvider from '@/redux/provider';
import '@ant-design/v5-patch-for-react-19';
import { App as AntdApp } from 'antd';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning={false}>
      <head>
        <title>HCMUS - Parallel Corpus</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AntdApp>
          <AntdRegistry>
            <ThemeProvider>
              <ReduxProvider>
                <AppLayout>{children}</AppLayout>
              </ReduxProvider>
            </ThemeProvider>
          </AntdRegistry>
        </AntdApp>
      </body>
    </html>
  );
}
