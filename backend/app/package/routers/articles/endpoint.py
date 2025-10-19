from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from package.models.article import ArticleCreate, ArticleUpdate, ArticleResponse, ArticleListResponse
from package.routers.articles.services import (
    create_new_article,
    get_article,
    get_article_by_slug_service,
    get_all_published_articles,
    publish_article,
    update_existing_article,
    delete_user_article,
    get_creator_articles
)
from package.core.auth import get_user_id_from_token

router = APIRouter(prefix="/articles", tags=["articles"])
security = HTTPBearer()

@router.post("/", response_model=ArticleResponse)
def create_article(
    article_data: ArticleCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new article"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    article = create_new_article(article_data, user_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create article"
        )
    
    return article

@router.get("/", response_model=List[ArticleListResponse])
def get_published_articles(
    search: Optional[str] = None,
    tags: Optional[str] = None
):
    """Get all published articles with optional search and tag filtering"""
    tag_list = tags.split(',') if tags else None
    return get_all_published_articles(search, tag_list)

@router.get("/my", response_model=List[ArticleListResponse])
def get_my_articles(
    status: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get creator's articles with optional filters"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    tag_list = tags.split(',') if tags else None
    articles = get_creator_articles(user_id, status, search, tag_list)
    return articles

@router.get("/slug/{slug}", response_model=ArticleResponse)
def get_article_by_slug(slug: str):
    """Get article by slug"""
    article = get_article_by_slug_service(slug)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    return article

@router.patch("/{article_id}/publish", response_model=dict)
def publish_article_endpoint(
    article_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Publish an article"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    if not publish_article(article_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found or unauthorized"
        )
    
    return {"message": "Article published successfully"}

@router.get("/{article_id}", response_model=ArticleResponse)
def get_article_by_id(article_id: str):
    """Get article by ID"""
    article = get_article(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    return article

@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: str,
    article_data: ArticleUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update an existing article"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    article = update_existing_article(article_id, article_data, user_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found or unauthorized"
        )
    
    return article

@router.delete("/{article_id}", response_model=dict)
def delete_article(
    article_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete an article"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    if not delete_user_article(article_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found or unauthorized"
        )
    
    return {"message": "Article deleted successfully"}