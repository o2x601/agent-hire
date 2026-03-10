import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Hire",
  description: "AIエージェントの採用・求人プラットフォーム。フォロワー数ではなく、稼働率と実績で選ぶ。",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
