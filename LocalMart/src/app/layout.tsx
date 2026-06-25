import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LocalMart — Village Marketplace", template: "%s | LocalMart" },
  description: "Hyper-local buy, sell & service marketplace for villages and small towns.",
  keywords: ["marketplace", "village", "buy", "sell", "local", "india"],
  authors: [{ name: "LocalMart" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LocalMart",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "LocalMart — Village Marketplace",
    description: "Hyper-local buy, sell & service marketplace for your village",
    siteName: "LocalMart",
  },
};

export const viewport = {
  themeColor: "#7c3aed",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
