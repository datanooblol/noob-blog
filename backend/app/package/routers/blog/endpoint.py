from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from package.models.blog import BlogCreate, BlogUpdate, BlogResponse, BlogListResponse
from package.routers.blog.services import (
    create_new_blog,
    get_blog,
    get_blog_by_slug_service,
    get_all_published_blog,
    publish_blog,
    update_existing_blog,
    delete_user_blog,
    get_creator_blog
)
from package.core.auth import get_user_id_from_token

router = APIRouter(prefix="/blog", tags=["blog"])
security = HTTPBearer()

@router.post("/", response_model=BlogResponse)
def create_blog(
    blog_data: BlogCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new blog"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    blog = create_new_blog(blog_data, user_id)
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create blog"
        )
    
    return blog

@router.get("/", response_model=List[BlogListResponse])
def get_published_blog(
    search: Optional[str] = None,
    tags: Optional[str] = None
):
    """Get all published blog with optional search and tag filtering"""
    tag_list = tags.split(',') if tags else None
    return get_all_published_blog(search, tag_list)

@router.get("/my", response_model=List[BlogListResponse])
def get_my_blog(
    status: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get creator's blog with optional filters"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    tag_list = tags.split(',') if tags else None
    blog = get_creator_blog(user_id, status, search, tag_list)
    return blog

@router.get("/{slug}", response_model=BlogResponse)
def get_blog_by_slug(slug: str):
    """Get blog by slug"""
    blog = get_blog_by_slug_service(slug)
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="blog not found"
        )
    return blog

@router.patch("/{blog_id}/publish", response_model=dict)
def publish_blog_endpoint(
    blog_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Publish an blog"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    if not publish_blog(blog_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="blog not found or unauthorized"
        )
    
    return {"message": "blog published successfully"}

@router.get("/id/{blog_id}", response_model=BlogResponse)
def get_blog_by_id(blog_id: str):
    """Get blog by ID"""
    blog = get_blog(blog_id)
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="blog not found"
        )
    return blog

@router.put("/{blog_id}", response_model=BlogResponse)
def update_blog(
    blog_id: str,
    blog_data: BlogUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update an existing blog"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    blog = update_existing_blog(blog_id, blog_data, user_id)
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="blog not found or unauthorized"
        )
    
    return blog

@router.delete("/{blog_id}", response_model=dict)
def delete_blog(
    blog_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete an blog"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    if not delete_user_blog(blog_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="blog not found or unauthorized"
        )
    
    return {"message": "blog deleted successfully"}