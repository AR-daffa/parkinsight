import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ParkInsight — Monitoring & Prediksi Parkir Triguna",
  description:
    "Pantau slot parkir tersedia secara real-time dan prediksi kepadatan +10, +15, dan +30 menit di Lahan Parkir Triguna UIN Jakarta.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
