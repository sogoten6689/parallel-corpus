'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import { Button, ConfigProvider, theme } from 'antd';
import 'antd/dist/reset.css';
import './globals.css';
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import '@ant-design/v5-patch-for-react-19';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "HCMUS - Parallel Corpus",
//   description: "HCMUS - Parallel Corpus",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const [mode, setMode] = useState<'light' | 'dark'>('light');

  // const locale = await getLocale();
  useEffect(() => {
    const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
    if (saved) setMode(saved);
  }, []);

  const toggleTheme = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('theme-mode', next);
  };
  return (
    <html lang={'en'}>
      <head>
        <title>HCMUS - Parallel Corpus</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        <ConfigProvider
          theme={{
            algorithm: mode == 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm
          }}
        >
          {children}
        <footer>
          <div className="flex justify-end ">
            <Button
            onClick={() => toggleTheme()}
          >
            {mode == 'light' && <SunOutlined />}
            {mode == 'dark' && <MoonOutlined />}
          </Button>
          </div>
        </footer>
        </ConfigProvider>
      </body>
    </html>
  );
}
