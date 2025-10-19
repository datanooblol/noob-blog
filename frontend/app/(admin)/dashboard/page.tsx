'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { articlesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Article {
  article_id: string;
  title: string;
  slug: string;
  cover_image: string;
  status: string;
  creator_id: string;
  tags: string[];
  seo_description: string;
  created_at: string;
  published_at: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusCounts = () => {
    const published = articles.filter(a => a.status === 'published').length;
    const draft = articles.filter(a => a.status === 'draft').length;
    const archived = articles.filter(a => a.status === 'archived').length;
    return { published, draft, archived };
  };

  const statusCounts = getStatusCounts();

  const loadAllTags = useCallback(async () => {
    try {
      const data = await articlesAPI.getMy();
      const uniqueTags = [...new Set(data.flatMap((article: Article) => article.tags || []))].sort();
      setAllTags(uniqueTags);
      console.log('[DASHBOARD] All tags loaded:', uniqueTags);
    } catch (error) {
      console.error('[DASHBOARD] Failed to load tags:', error);
    }
  }, []);

  const loadArticles = useCallback(async () => {
    console.log('[DASHBOARD] Loading articles with:', { search, statusFilter, selectedTags });
    try {
      setLoading(true);
      const tags = selectedTags.length > 0 ? selectedTags : undefined;
      const searchParam = search.trim() || undefined;
      const data = await articlesAPI.getMy(statusFilter || undefined, searchParam, tags);
      console.log('[DASHBOARD] Articles loaded:', data.length, 'articles');
      setArticles(data);
    } catch (error) {
      console.error('[DASHBOARD] Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, selectedTags]);

  // Debounce search to reduce API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadArticles();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // Load immediately for status and tag changes
  useEffect(() => {
    loadArticles();
  }, [statusFilter, selectedTags]);

  // Initial load
  useEffect(() => {
    loadAllTags();
    if (!search && !statusFilter && selectedTags.length === 0) {
      loadArticles();
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={()=>router.push('/editor')}>Create New Article</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{articles.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{statusCounts.published}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.draft}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-600">Archived</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{statusCounts.archived}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Articles</CardTitle>
            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <select
                  value=""
                  onChange={(e) => {
                    const tag = e.target.value;
                    if (tag && !selectedTags.includes(tag)) {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">+ Add Tag Filter</option>
                  {allTags.filter(tag => !selectedTags.includes(tag)).map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                        className="hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading articles...</p>
            ) : articles.length === 0 ? (
              <p>{search || statusFilter || selectedTags.length > 0 ? 'No articles match your filters.' : 'No articles yet. Create your first article!'}</p>
            ) : (
              <div className="space-y-4">
                {articles.map((article: Article) => (
                  <div 
                    key={article.article_id} 
                    className="border p-4 rounded hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={()=>router.push(`/editor?id=${article.article_id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{article.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(article.status)}`}>
                        {article.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(article.created_at).toLocaleDateString()}
                    </p>
                    {article.published_at && (
                      <p className="text-sm text-green-600">
                        Published: {new Date(article.published_at).toLocaleDateString()}
                      </p>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.map(tag => (
                          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
