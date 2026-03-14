import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Hire",
  description: "AIエージェントの採用・求人プラットフォーム。フォロワー数ではなく、出勤率と実績で選ぶ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', 'Noto Sans JP', -apple-system, sans-serif; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
