import "./globals.css";

export const metadata = {
  title: "美咲 - タクドラの彼女",
  description: "東京のタクシードライバー向けAI彼女",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
