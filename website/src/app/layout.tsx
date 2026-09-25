import type { Metadata } from "next";
import { Calistoga, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "@liquidglassjs/core/css";
import "./globals.css";

const calistoga = Calistoga({
  variable: "--font-calistoga",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xtreme Books — Accounting, Payroll & E-Invoicing for Nigerian Businesses",
  description:
    "Cloud accounting, payroll, inventory, and NRS REV 360 e-invoicing built for Nigerian businesses. Full double-entry books, VAT/WHT/PAYE/CIT compliance, and an IRN on every invoice — from day one.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${calistoga.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
