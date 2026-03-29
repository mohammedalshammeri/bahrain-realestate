import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bahrain Property Hub - Admin Dashboard",
  description: "Admin dashboard for Bahrain Property Hub real estate platform",
};

import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Only wrap the body content with LanguageProvider, don't control the <html> tag directly here
    // since Next.js server compatibility is important. However, for client-side state driven
    // dir/lang, we can do it inside the Provider via document.documentElement manipulation.
    // We also suppress hydration warnings on the root html/body because theme and language
    // providers may adjust attributes (like dir or classes) on the client after hydration.
    <html lang="en" suppressHydrationWarning>
       <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
