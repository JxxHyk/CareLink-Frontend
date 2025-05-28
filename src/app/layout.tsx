// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css'; // 전역 CSS

export const metadata: Metadata = {
  title: 'CareLink',
  description: '모니터링 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children} {/* 페이지별 내용이 여기에 바로 렌더링됨 */}
      </body>
    </html>
  );
}