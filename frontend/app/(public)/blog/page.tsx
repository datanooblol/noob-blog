"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { blogAPI } from "@/lib/api";
import Link from "next/link";

interface Blog {
  blog_id: string;
  title: string;
  slug: string;
  seo_description: string;
  tags: string[];
  created_at: string;
  published_at: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const loadAllTags = useCallback(async () => {
    try {
      const data = await blogAPI.getAll();
      const tags = [
        ...new Set(data.flatMap((blog: Blog) => blog.tags)),
      ].sort() as string[];
      setAllTags(tags);
      console.log("[BLOG] All tags loaded:", tags);
    } catch (error) {
      console.error("[BLOG] Failed to load tags:", error);
    }
  }, []);

  const loadPublishedArticles = useCallback(async () => {
    console.log("[BLOG] Loading articles with:", { searchTerm, selectedTags });
    try {
      setLoading(true);
      const data = await blogAPI.getAll(
        searchTerm || undefined,
        selectedTags.length > 0 ? selectedTags : undefined
      );
      console.log("[BLOG] Articles loaded:", data.length, "articles");
      setBlogs(data);
    } catch (error) {
      console.error("[BLOG] Failed to load articles:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedTags]);

  // Initial load
  useEffect(() => {
    loadAllTags();
    if (!searchTerm && selectedTags.length === 0) {
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
  }, [selectedTags]);

  return (
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
            value=""
            onChange={(e) => {
              const tag = e.target.value;
              if (tag && !selectedTags.includes(tag)) {
                setSelectedTags([...selectedTags, tag]);
              }
            }}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">+ Add Tag Filter</option>
            {allTags
              .filter((tag) => !selectedTags.includes(tag))
              .map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
          </select>
        </div>
        {selectedTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() =>
                    setSelectedTags(selectedTags.filter((t) => t !== tag))
                  }
                  className="hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center">Loading articles...</p>
      ) : blogs.length === 0 ? (
        <p className="text-center text-gray-600">
          {searchTerm || selectedTags.length > 0
            ? "No articles match your search."
            : "No articles published yet."}
        </p>
      ) : (
        <div className="grid gap-6">
          {blogs.map((blog) => (
            <Card
              key={blog.blog_id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-xl">
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="hover:text-blue-600"
                  >
                    {blog.title}
                  </Link>
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Published on{" "}
                  {new Date(blog.published_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {blog.seo_description || "No description available."}
                </p>
                {blog.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {blog.tags.map((tag) => (
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
  );
}
