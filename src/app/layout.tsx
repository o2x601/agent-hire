import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOLVAN — チームの速度を、再定義する",
  description: "課題管理、スプリント計画、ドキュメント——すべてを一つの場所に。思考のスピードで動くプロダクト開発ツール。",
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
