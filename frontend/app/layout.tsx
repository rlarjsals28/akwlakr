import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import NavBar from '../components/NavBar';
import BottomNav from '../components/BottomNav';

export const metadata: Metadata = {
  title: 'AI Nutrition Coach',
  description: '음식 사진만으로 영양 분석과 맞춤 식단 추천을 받는 AI 헬스케어 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nutrition Coach',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <NavBar />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
