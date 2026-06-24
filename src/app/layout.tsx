import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Metavision — AI That Works For Your Business",
  description:
    "Seamlessly integrate AI into your business workflow with professional database management, automation, and full technical support.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Metavision" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
