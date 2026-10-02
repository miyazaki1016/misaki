import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import BackgroundPushSync
  from "./BackgroundPushSync";

export const metadata:
  Metadata = {
  title:
    "美咲 - 会話AI",

  description:
    "会話と記憶から関係が育つAIパートナー",

  applicationName:
    "美咲",

  manifest:
    "/manifest.webmanifest",

  icons: {
    apple:
      "/apple-touch-icon.png",
  },

  appleWebApp: {
    capable:
      true,

    statusBarStyle:
      "default",

    title:
      "美咲",
  },

  formatDetection: {
    telephone:
      false,
  },
};

export const viewport:
  Viewport = {
  themeColor:
    "#ffffff",

  width:
    "device-width",

  initialScale:
    1,

  viewportFit:
    "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <BackgroundPushSync />

        {children}
      </body>
    </html>
  );
}
