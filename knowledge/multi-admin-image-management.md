# Multi-Admin Image Management Architecture

## Overview
This document outlines the architecture for supporting multiple administrators with user-specific image ownership and access control.

## Current vs Future State

### Current (Single Admin)
```
S3 Structure:
blog-images/
├── uuid1.jpg
├── uuid2.png
└── uuid3.gif

Database:
- No user tracking
- Global image access
```

### Future (Multi-Admin)
```
S3 Structure:
blog-images/
├── user-123/
│   ├── article-456/
│   │   ├── image1.jpg
│   │   └── image2.png
│   └── article-789/
│       └── cover.jpg
└── user-456/
    └── article-101/
        └── hero-image.jpg

Database:
- User ownership tracking
- Role-based access control
```

## Database Schema Changes

### New Users Table
```python
{
  "user_id": "user-123",           # Primary key
  "username": "admin1",            # Display name
  "email": "admin1@blog.com",      # Login email
  "role": "admin",                 # admin, editor, viewer
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-15T10:30:00Z",
  "is_active": true
}
```

### Updated Articles Table
```python
{
  "article_id": "article-456",
  "author_id": "user-123",         # NEW: Track article owner
  "title": "My Article",
  "content": [...],
  "images": [                      # NEW: Include user path in image URLs
    "user-123/article-456/image1.jpg",
    "user-123/article-456/image2.png"
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## S3 Folder Structure Strategy

### Hierarchical Organization
```
blog-images/
├── {user_id}/
│   ├── {article_id}/
│   │   ├── {filename}
│   │   └── {filename}
│   └── profile/
│       └── avatar.jpg
└── shared/
    └── site-assets/
        ├── logo.png
        └── favicon.ico
```

### Path Generation Logic
```python
def generate_s3_key(user_id: str, article_id: str, filename: str) -> str:
    """Generate user-specific S3 key for image uploads"""
    safe_filename = sanitize_filename(filename)
    return f"{user_id}/{article_id}/{safe_filename}"

def generate_public_url(s3_key: str) -> str:
    """Generate public URL for image access"""
    return f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
```

## Pre-signed URL Implementation

### Current Flow (Single Admin)
```
1. Browser → API: Upload image
2. API → S3: Store with random UUID
3. API → Browser: Return public URL
```

### New Flow (Multi-Admin)
```
1. Browser → API: Request upload permission (with auth)
2. API: Validate user permissions
3. API: Generate user-specific S3 path
4. API → S3: Create pre-signed URL for user path
5. API → Browser: Return pre-signed URL
6. Browser → S3: Direct upload to user folder
7. Browser → API: Confirm upload completion
8. API → Browser: Return public URL
```

### API Endpoint Changes
```python
@router.post("/upload/presigned")
async def get_presigned_url(
    filename: str,
    article_id: str,
    current_user: User = Depends(get_current_user)
):
    # Generate user-specific S3 key
    s3_key = generate_s3_key(current_user.user_id, article_id, filename)
    
    # Create pre-signed URL with user context
    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': BUCKET_NAME,
            'Key': s3_key,
            'ContentType': get_content_type(filename)
        },
        ExpiresIn=900  # 15 minutes
    )
    
    return {
        "upload_url": presigned_url,
        "s3_key": s3_key,
        "public_url": generate_public_url(s3_key)
    }
```

## Access Control & Security

### Permission Levels
```python
class UserRole(Enum):
    ADMIN = "admin"        # Full access to all content
    EDITOR = "editor"      # Access to own content only
    VIEWER = "viewer"      # Read-only access
```

### Access Rules
- **Own Content**: Users can CRUD their own articles and images
- **Others' Content**: Only admins can access other users' content
- **Public Access**: Published articles are publicly accessible
- **Image Access**: Images follow article permissions

### S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::blog-images/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/published": "true"
        }
      }
    }
  ]
}
```

## Migration Strategy

### Phase 1: Add User System
1. Create users table
2. Add authentication endpoints
3. Update article creation to include author_id
4. Maintain backward compatibility

### Phase 2: Implement User-Specific Uploads
1. Update upload endpoints with user context
2. Implement S3 folder structure
3. Add access control middleware
4. Test with multiple users

### Phase 3: Migrate Existing Data
1. Create default admin user
2. Assign existing articles to default user
3. Move existing images to user folders
4. Update image URLs in articles

## Benefits

### Security
- **Isolation**: Users cannot access each other's images
- **Audit Trail**: Track who uploaded what and when
- **Access Control**: Role-based permissions

### Organization
- **Clean Structure**: Logical folder hierarchy
- **Easy Backup**: User-specific backup strategies
- **Scalability**: Supports unlimited users

### Analytics & Management
- **Usage Tracking**: Monitor storage per user
- **Cost Allocation**: Billing per user/department
- **Performance**: Faster queries with user filtering

## Implementation Considerations

### Environment Differences
```python
# Development (LocalStack)
if not os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    # Use existing direct upload for simplicity
    
# Production (AWS)
else:
    # Use pre-signed URLs with user context
```

### Backward Compatibility
- Existing images remain accessible
- Gradual migration of old content
- Support both old and new URL formats

### Performance Optimization
- Cache user permissions
- Batch S3 operations
- Use CloudFront for image delivery

## Future Enhancements

### Advanced Features
- **Image Versioning**: Track image history
- **Collaborative Editing**: Shared article ownership
- **Image Processing**: Automatic resizing/optimization
- **CDN Integration**: CloudFront with user-specific caching

### Monitoring & Analytics
- **Usage Dashboards**: Per-user storage metrics
- **Access Logs**: Image access patterns
- **Cost Tracking**: S3 costs per user
- **Performance Metrics**: Upload success rates

## Next Steps

1. **Design Review**: Validate schema and architecture
2. **Prototype**: Implement basic multi-user support
3. **Testing**: Verify access control and permissions
4. **Migration Plan**: Strategy for existing data
5. **Production Deployment**: Terraform infrastructure updates