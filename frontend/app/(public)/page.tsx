import Link from "next/link";
import FeatureCard from "@/components/FeatureCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "datanooblol - Personal Blog",
  description: "Welcome to my personal blog where I share thoughts, experiences, and insights about technology, development, and life.",
  keywords: "blog, technology, development, programming, personal",
  robots: "index, follow",
  openGraph: {
    title: "datanooblol - Personal Blog",
    description: "Welcome to my personal blog where I share thoughts, experiences, and insights about technology, development, and life.",
    type: "website",
    siteName: "datanooblol",
  },
  twitter: {
    card: "summary_large_image",
    title: "datanooblol - Personal Blog",
    description: "Welcome to my personal blog where I share thoughts, experiences, and insights about technology, development, and life.",
  },
};

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to My Blog
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sharing thoughts, experiences, and insights about technology,
            development, and life.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/blog"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Read My Blog
            </Link>
            <Link
              href="/about"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              About Me
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Latest Articles"
            description="Discover my latest thoughts and experiences in technology and development."
            href="/blog"
            linkText="Explore Blog"
          />
          <FeatureCard
            title="About Me"
            description="Learn more about my background, skills, and professional journey."
            href="/about"
            linkText="Read More"
          />
          <FeatureCard
            title="Get in Touch"
            description="Have questions or want to collaborate? I'd love to hear from you."
            href="/contact"
            linkText="Contact Me"
          />
        </div>
      </div>
    </>
  );
}
