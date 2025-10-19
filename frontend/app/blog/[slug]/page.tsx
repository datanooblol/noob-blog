import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import "../../article-content.css";

interface Article {
  article_id: string;
  title: string;
  slug: string;
  content: {
    type: string;
    content?: { text: string }[];
    props?: { level: string };
  }[];
  html_content?: string;
  seo_description: string;
  tags: string[];
  redirect_url?: string;
  created_at: string;
  published_at: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const response = await fetch(
      `http://localhost:8001/articles/slug/${slug}`,
      {
        cache: "no-store",
      }
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function decodeHtml(html: string): string {
  return html
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&/g, "&");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.seo_description || `Read ${article.title} on our blog`,
    keywords: article.tags.join(", "),
    openGraph: {
      title: article.title,
      description:
        article.seo_description || `Read ${article.title} on our blog`,
      type: "article",
      publishedTime: article.published_at,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description:
        article.seo_description || `Read ${article.title} on our blog`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Handle redirect if redirect_url is set
  if (article.redirect_url) {
    redirect(article.redirect_url);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <Link href="/blog">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Blog
            </Button>
          </Link>
        </div>

        <article>
          <header className="mb-12">
            <h1 className="text-5xl font-bold mb-6 text-gray-900 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-500 mb-6">
              <time className="text-sm">
                {new Date(article.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            {article.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          <div className="article-content">
            {article.html_content ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: decodeHtml(article.html_content),
                }}
              />
            ) : (
              <div>No content available</div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
