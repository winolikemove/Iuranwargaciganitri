import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import { AppProvider } from "@/context/app-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pradha Ciganitri - Sistem Manajemen Warga",
  description: "Aplikasi manajemen warga modern untuk mengelola keuangan, pembayaran, agenda, dan informasi warga secara digital.",
  keywords: ["manajemen warga", "perumahan", "keuangan warga", "iuran", "pengumuman"],
  authors: [{ name: "Pradha Ciganitri" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Pradha Ciganitri",
    description: "Sistem Manajemen Warga Modern",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
