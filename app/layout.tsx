import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zero Task Router · Team XOF",
  description:
    "Describe any task in plain English. Zero finds the best capability. x402 pays automatically in USDC on Base. No API keys. No subscriptions.",
  keywords: ["zero", "x402", "USDC", "Base", "task router", "AI capabilities", "hackathon"],
  authors: [{ name: "Team XOF — Zero UNLOCKED Hackathon" }],
  openGraph: {
    title: "Zero Task Router",
    description: "Plain-English task → Zero capability → x402 auto-pay → result.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Zero Task Router",
    description: "Plain-English task → Zero capability → x402 auto-pay → result.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ background: '#080808', minHeight: '100vh', margin: 0 }}>{children}</body>
    </html>
  );
}
