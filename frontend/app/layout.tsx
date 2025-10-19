import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Your Blog - Thoughts, Experiences & Insights",
  description: "Personal blog sharing thoughts, experiences, and insights about technology, development, and life.",
  keywords: "blog, technology, development, programming, personal",
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "Your Blog - Thoughts, Experiences & Insights",
    description: "Personal blog sharing thoughts, experiences, and insights about technology, development, and life.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
