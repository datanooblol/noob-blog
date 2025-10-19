import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
// Add these type definitions at the top
interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name: string;
}

interface ArticleData {
  title: string;
  slug?: string;
  content: object[]; // BlockNote content array
  html_content?: string;
  tags?: string[];
  seo_description?: string;
  cover_image?: string;
  status?: string;
  redirect_url?: string;
}

// Update the functions:
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};

// Articles endpoints
export const articlesAPI = {
  getAll: async (search?: string, tags?: string[]) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (tags?.length) params.tags = tags.join(',');
    const response = await api.get("/articles/", { params });
    return response.data;
  },
  getMy: async (status?: string, search?: string, tags?: string[]) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (search) params.search = search;
    if (tags?.length) params.tags = tags.join(',');
    const response = await api.get("/articles/my", { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  },
  create: async (data: ArticleData) => {
    const response = await api.post("/articles/", data);
    return response.data;
  },
  update: async (id: string, data: Partial<ArticleData>) => {
    const response = await api.put(`/articles/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  },
  publish: async (id: string) => {
    const response = await api.patch(`/articles/${id}/publish`);
    return response.data;
  },
  // Add this to articlesAPI object
  getBySlug: async (slug: string) => {
    const response = await api.get(`/articles/slug/${slug}`);
    return response.data;
  },
};
