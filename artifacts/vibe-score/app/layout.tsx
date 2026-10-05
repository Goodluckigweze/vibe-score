import type { Metadata } from "next";
import "./globals.css";
import { WalletProviders } from "./providers";

export const metadata: Metadata = {
  title: "Vibe Score — on-chain personality",
  description: "Uncover your on-chain personality on Robinhood Chain Testnet.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><WalletProviders>{children}</WalletProviders></body>
    </html>
  );
}