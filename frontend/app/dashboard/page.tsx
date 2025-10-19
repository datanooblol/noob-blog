'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await articlesAPI.getMy();
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={()=>router.push('/articles/editor')}>Create New Article</Button>
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading articles...</p>
            ) : articles.length === 0 ? (
              <p>No articles yet. Create your first article!</p>
            ) : (
              <div className="space-y-4">
                {articles.map((article: Article) => (
                  <div 
                    key={article.article_id} 
                    className="border p-4 rounded hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={()=>router.push(`/articles/editor?id=${article.article_id}`)}
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
