from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# Request models
class ArticleCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    content: List[Dict[str, Any]]  # BlockNote JSON array
    html_content: Optional[str] = None # For caching
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = []
    seo_description: Optional[str] = None
    redirect_url: Optional[str] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Title must be at least 3 characters long')
        return v.strip()

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[List[Dict[str, Any]]] = None  # BlockNote JSON array
    html_content: Optional[str] = None # For caching
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    seo_description: Optional[str] = None
    status: Optional[str] = None
    redirect_url: Optional[str] = None

# Response models
class ArticleResponse(BaseModel):
    article_id: str
    title: str
    slug: str
    content: List[Dict[str, Any]]  # BlockNote JSON array
    html_content: Optional[str] = None # For display
    cover_image: Optional[str] = None
    status: str
    creator_id: str
    tags: List[str]
    seo_description: Optional[str] = None
    redirect_url: Optional[str] = None
    created_at: str
    updated_at: str
    published_at: Optional[str] = None

class ArticleListResponse(BaseModel):
    article_id: str
    title: str
    slug: str
    cover_image: Optional[str] = None
    status: str
    creator_id: str
    tags: List[str]
    seo_description: Optional[str] = None
    created_at: str
    published_at: Optional[str] = None