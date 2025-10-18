"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { articlesAPI } from "@/lib/api";
import Link from "next/link";

interface Article {
  article_id: string;
  title: string;
  slug: string;
  seo_description: string;
  tags: string[];
  created_at: string;
  published_at: string;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedArticles();
  }, []);

  const loadPublishedArticles = async () => {
    try {
      const data = await articlesAPI.getAll();
      setArticles(data);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-gray-600">Latest articles and thoughts</p>
        </div>

        {loading ? (
          <p className="text-center">Loading articles...</p>
        ) : articles.length === 0 ? (
          <p className="text-center text-gray-600">
            No articles published yet.
          </p>
        ) : (
          <div className="grid gap-6">
            {articles.map((article) => (
              <Card
                key={article.article_id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-xl">
                    <Link
                      href={`/blog/${article.slug}`}
                      className="hover:text-blue-600"
                    >
                      {article.title}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Published on{" "}
                    {new Date(article.published_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    {article.seo_description || "No description available."}
                  </p>
                  {article.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
