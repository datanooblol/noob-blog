import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - datanooblol",
  description: "Browse all published articles covering technology, development, and personal insights. Find the latest posts and filter by topics.",
  keywords: "blog, articles, technology, development, programming, insights",
  robots: "index, follow",
  openGraph: {
    title: "Blog - datanooblol",
    description: "Browse all published articles covering technology, development, and personal insights. Find the latest posts and filter by topics.",
    type: "website",
    siteName: "datanooblol",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - datanooblol",
    description: "Browse all published articles covering technology, development, and personal insights. Find the latest posts and filter by topics.",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}