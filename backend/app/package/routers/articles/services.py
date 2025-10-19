import uuid
import re
from datetime import datetime
from typing import Optional, List
from package.core.database import (
    create_article,
    get_article_by_id,
    get_article_by_slug,
    get_published_articles,
    update_article,
    delete_article,
    get_user_articles
)
from package.models.article import ArticleCreate, ArticleResponse, ArticleListResponse

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def create_new_article(article_data: ArticleCreate, creator_id: str) -> Optional[ArticleResponse]:
    """Create a new article"""
    article_id = str(uuid.uuid4())
    slug = article_data.slug or create_slug(article_data.title)
    now = datetime.utcnow().isoformat()
    
    # Check if slug already exists
    if get_article_by_slug(slug):
        slug = f"{slug}-{article_id[:8]}"
    
    article_record = {
        'article_id': article_id,
        'sk': 'METADATA',
        'title': article_data.title,
        'slug': slug,
        'content': article_data.content,
        'html_content': article_data.html_content,
        'cover_image': article_data.cover_image or '',
        'status': 'draft',
        'creator_id': creator_id,
        'tags': article_data.tags or [],
        'seo_description': article_data.seo_description or '',
        'redirect_url': article_data.redirect_url or '',
        'created_at': now,
        'updated_at': now,
        'published_at': None
    }
    
    if create_article(article_record):
        return ArticleResponse(**article_record)
    return None

def get_article(article_id: str) -> Optional[ArticleResponse]:
    """Get article by ID"""
    article = get_article_by_id(article_id)
    if article:
        return ArticleResponse(**article)
    return None

def get_article_by_slug_service(slug: str) -> Optional[ArticleResponse]:
    """Get article by slug"""
    article = get_article_by_slug(slug)
    if article:
        return ArticleResponse(**article)
    return None

def get_all_published_articles() -> List[ArticleListResponse]:
    """Get all published articles"""
    articles = get_published_articles()
    return [ArticleListResponse(**article) for article in articles]

def update_existing_article(article_id: str, article_data, creator_id: str) -> Optional[ArticleResponse]:
    """Update an existing article"""
    # Verify ownership
    article = get_article_by_id(article_id)
    if not article or article['creator_id'] != creator_id:
        return None
    
    updates = {
        'updated_at': datetime.utcnow().isoformat()
    }
    
    # Update fields if provided
    if article_data.title:
        updates['title'] = article_data.title
        # Only update slug if article is not published
        if article['status'] != 'published':
            updates['slug'] = article_data.slug or create_slug(article_data.title)
    if article_data.slug and article['status'] != 'published':
        updates['slug'] = article_data.slug
    if article_data.content is not None:
        updates['content'] = article_data.content
    if article_data.html_content is not None:
        updates['html_content'] = article_data.html_content
    if article_data.cover_image is not None:
        updates['cover_image'] = article_data.cover_image
    if article_data.tags is not None:
        updates['tags'] = article_data.tags
    if article_data.seo_description is not None:
        updates['seo_description'] = article_data.seo_description
    if article_data.redirect_url is not None:
        updates['redirect_url'] = article_data.redirect_url
    if article_data.status:
        updates['status'] = article_data.status
        if article_data.status == 'published' and not article.get('published_at'):
            updates['published_at'] = datetime.utcnow().isoformat()
    
    if update_article(article_id, updates):
        updated_article = get_article_by_id(article_id)
        return ArticleResponse(**updated_article)
    return None

def delete_user_article(article_id: str, creator_id: str) -> bool:
    """Delete an article (with ownership check)"""
    article = get_article_by_id(article_id)
    if not article or article['creator_id'] != creator_id:
        return False
    
    return delete_article(article_id)

def get_creator_articles(creator_id: str, status: Optional[str] = None) -> List[ArticleListResponse]:
    """Get articles by creator with optional status filter"""
    articles = get_user_articles(creator_id, status)
    return [ArticleListResponse(**article) for article in articles]

def publish_article(article_id: str, creator_id: str) -> bool:
    """Publish an article"""
    article = get_article_by_id(article_id)
    print(article)
    if not article or article['creator_id'] != creator_id:
        return False
    
    updates = {
        'status': 'published',
        'published_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    return update_article(article_id, updates)