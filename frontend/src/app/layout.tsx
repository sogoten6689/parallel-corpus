'use client';
import './i18n/config';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@ant-design/v5-patch-for-react-19';
import AppLayout from "@/components/ui/app-layout";
import AuthLayout from "@/components/ui/auth-layout";
import ThemeProvider from "./theme-provider";
import ReduxProvider from '@/redux/provider';
import '@ant-design/v5-patch-for-react-19';
import { App as AntdApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLanguageProvider } from '@/contexts/AppLanguageContext';
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Component to conditionally render layout based on pathname
function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const [queryClient] = useState(() => new QueryClient())
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
              <AppLanguageProvider>
                <AuthProvider>
                  <ReduxProvider>
                    <QueryClientProvider client={queryClient}>
                      <ConditionalLayout>{children}</ConditionalLayout>
                    </QueryClientProvider>
                  </ReduxProvider>
                </AuthProvider>
              </AppLanguageProvider>
            </ThemeProvider>
          </AntdRegistry>
        </AntdApp>
      </body>
    </html>
  );
}
