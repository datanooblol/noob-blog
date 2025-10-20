import { MetadataRoute } from "next";

async function getPublishedArticles() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/blog/`,
      {
        cache: "no-store",
      }
    );
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const articles = await getPublishedArticles();

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ];

  const articlePages = articles.map(
    (article: { slug: string; updated_at?: string; published_at: string }) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: new Date(article.updated_at || article.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  return [...staticPages, ...articlePages];
}
