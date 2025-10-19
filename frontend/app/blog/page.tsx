"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [allTags, setAllTags] = useState<string[]>([]);

  const loadPublishedArticles = useCallback(async () => {
    console.log('[BLOG] Loading articles with:', { searchTerm, selectedTag });
    try {
      setLoading(true);
      const data = await articlesAPI.getAll(
        searchTerm || undefined,
        selectedTag ? [selectedTag] : undefined
      );
      console.log('[BLOG] Articles loaded:', data.length, 'articles');
      setArticles(data);
      
      // Extract unique tags
      const tags = [...new Set(data.flatMap(article => article.tags))].sort();
      setAllTags(tags);
      console.log('[BLOG] Tags extracted:', tags);
    } catch (error) {
      console.error("[BLOG] Failed to load articles:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedTag]);

  // Initial load
  useEffect(() => {
    if (!searchTerm && !selectedTag) {
      loadPublishedArticles();
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPublishedArticles();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Immediate tag filter
  useEffect(() => {
    loadPublishedArticles();
  }, [selectedTag]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-gray-600">Latest articles and thoughts</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 flex-col sm:flex-row">
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
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
