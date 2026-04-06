import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Sidebar } from "@/components/sidebar";
import { WalletWidget } from "@/components/wallet-widget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HyperSignals \u2014 Strategy Builder",
  description: "Build and deploy trading strategies with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        <div className="flex h-full">
          <Sidebar />
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
            {/* Top bar with wallet */}
            <div className="shrink-0 flex items-center justify-end px-4 py-2 border-b border-border">
              <WalletWidget />
            </div>
            <main className="flex-1 min-w-0 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
