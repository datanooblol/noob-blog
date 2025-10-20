import uuid
import re
from datetime import datetime
from typing import Optional, List
from package.core.database import (
    create_blog,
    get_blog_by_id,
    get_blog_by_slug,
    get_published_blog,
    update_blog,
    delete_blog,
    get_user_blog
)
from package.models.blog import BlogCreate, BlogResponse, BlogListResponse

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def create_new_blog(blog_data: BlogCreate, user_id: str) -> Optional[BlogResponse]:
    """Create a new blog"""
    blog_id = str(uuid.uuid4())
    slug = blog_data.slug or create_slug(blog_data.title)
    now = datetime.utcnow().isoformat()
    
    # Check if slug already exists
    if get_blog_by_slug(slug):
        slug = f"{slug}-{blog_id[:8]}"
    
    blog_record = {
        'blog_id': blog_id,
        'sk': 'METADATA',
        'title': blog_data.title,
        'slug': slug,
        'content': blog_data.content,
        'html_content': blog_data.html_content,
        'cover_image': blog_data.cover_image or '',
        'status': 'draft',
        'user_id': user_id,
        'tags': blog_data.tags or [],
        'seo_description': blog_data.seo_description or '',
        'redirect_url': blog_data.redirect_url or '',
        'created_at': now,
        'updated_at': now,
        'published_at': None
    }
    
    # Response record (excludes sk)
    response_record = {k: v for k, v in blog_record.items() if k != 'sk'}
    
    if create_blog(blog_record):
        return BlogResponse(**response_record)
    return None

def get_blog(blog_id: str) -> Optional[BlogResponse]:
    """Get blog by ID"""
    blog = get_blog_by_id(blog_id)
    if blog:
        # Remove sk field for response
        response_data = {k: v for k, v in blog.items() if k != 'sk'}
        return BlogResponse(**response_data)
    return None

def get_blog_by_slug_service(slug: str) -> Optional[BlogResponse]:
    """Get blog by slug"""
    blog = get_blog_by_slug(slug)
    if blog:
        # Remove sk field for response
        response_data = {k: v for k, v in blog.items() if k != 'sk'}
        return BlogResponse(**response_data)
    return None

def get_all_published_blog(search: Optional[str] = None, tags: Optional[List[str]] = None) -> List[BlogListResponse]:
    """Get all published blog with optional filtering"""
    blog = get_published_blog()
    
    # Apply filters
    if search:
        search_lower = search.lower()
        filtered_blog = []
        for a in blog:
            try:
                # Check title
                if search_lower in a.get('title', '').lower():
                    filtered_blog.append(a)
                    continue
                
                # Check content (handle both string and object content)
                content = a.get('content', '')
                if isinstance(content, str) and search_lower in content.lower():
                    filtered_blog.append(a)
                    continue
                
                # Check tags
                tags_list = a.get('tags', [])
                if isinstance(tags_list, list) and any(search_lower in tag.lower() for tag in tags_list if isinstance(tag, str)):
                    filtered_blog.append(a)
            except Exception as e:
                print(f"Error filtering blog {a.get('blog_id', 'unknown')}: {e}")
                continue
        blog = filtered_blog
    
    if tags:
        blog = [a for a in blog if 
                   isinstance(a.get('tags', []), list) and 
                   any(tag in a.get('tags', []) for tag in tags)]
    
    return [BlogListResponse(**{k: v for k, v in blog_item.items() if k != 'sk'}) for blog_item in blog]

def update_existing_blog(blog_id: str, blog_data, user_id: str) -> Optional[BlogResponse]:
    """Update an existing blog"""
    # Verify ownership
    blog = get_blog_by_id(blog_id)
    if not blog or blog['user_id'] != user_id:
        return None
    
    updates = {
        'updated_at': datetime.utcnow().isoformat()
    }
    
    # Update fields if provided
    if blog_data.title:
        updates['title'] = blog_data.title
        # Only update slug if blog is not published
        if blog['status'] != 'published':
            updates['slug'] = blog_data.slug or create_slug(blog_data.title)
    if blog_data.slug and blog['status'] != 'published':
        updates['slug'] = blog_data.slug
    if blog_data.content is not None:
        updates['content'] = blog_data.content
    if blog_data.html_content is not None:
        updates['html_content'] = blog_data.html_content
    if blog_data.cover_image is not None:
        updates['cover_image'] = blog_data.cover_image
    if blog_data.tags is not None:
        updates['tags'] = blog_data.tags
    if blog_data.seo_description is not None:
        updates['seo_description'] = blog_data.seo_description
    if blog_data.redirect_url is not None:
        updates['redirect_url'] = blog_data.redirect_url
    if blog_data.status:
        updates['status'] = blog_data.status
        if blog_data.status == 'published' and not blog.get('published_at'):
            updates['published_at'] = datetime.utcnow().isoformat()
    
    if update_blog(blog_id, updates):
        updated_blog = get_blog_by_id(blog_id)
        # Remove sk field for response
        response_data = {k: v for k, v in updated_blog.items() if k != 'sk'}
        return BlogResponse(**response_data)
    return None

def delete_user_blog(blog_id: str, user_id: str) -> bool:
    """Delete an blog (with ownership check)"""
    blog = get_blog_by_id(blog_id)
    if not blog or blog['user_id'] != user_id:
        return False
    
    return delete_blog(blog_id)

def get_creator_blog(user_id: str, status: Optional[str] = None, search: Optional[str] = None, tags: Optional[List[str]] = None) -> List[BlogListResponse]:
    """Get blog by creator with optional filters"""
    blog = get_user_blog(user_id, status)
    
    # Apply filters
    if search:
        search_lower = search.lower()
        filtered_blog = []
        for a in blog:
            try:
                # Check title
                if search_lower in a.get('title', '').lower():
                    filtered_blog.append(a)
                    continue
                
                # Check content (handle both string and object content)
                content = a.get('content', '')
                if isinstance(content, str) and search_lower in content.lower():
                    filtered_blog.append(a)
                    continue
                
                # Check tags
                tags_list = a.get('tags', [])
                if isinstance(tags_list, list) and any(search_lower in tag.lower() for tag in tags_list if isinstance(tag, str)):
                    filtered_blog.append(a)
            except Exception as e:
                print(f"Error filtering blog {a.get('blog_id', 'unknown')}: {e}")
                continue
        blog = filtered_blog
    
    if tags:
        blog = [a for a in blog if 
                   isinstance(a.get('tags', []), list) and 
                   any(tag in a.get('tags', []) for tag in tags)]
    
    return [BlogListResponse(**{k: v for k, v in blog_item.items() if k != 'sk'}) for blog_item in blog]

def publish_blog(blog_id: str, user_id: str) -> bool:
    """Publish an blog"""
    blog = get_blog_by_id(blog_id)
    print(blog)
    if not blog or blog['user_id'] != user_id:
        return False
    
    updates = {
        'status': 'published',
        'published_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    return update_blog(blog_id, updates)