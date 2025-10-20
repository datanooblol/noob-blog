import boto3
import uuid
import os
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from package.core.auth import get_user_id_from_token

router = APIRouter(prefix="/upload", tags=["upload"])
security = HTTPBearer()

# Request models
class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str
    blog_id: str

ALLOWED_IMAGE_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png', 
    'image/gif': 'gif',
    'image/webp': 'webp'
}
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'datanooblol-blog-images-dev-20251020')
# S3 client configuration
def get_s3_client():
    return boto3.client(
        's3',
        region_name=AWS_REGION,
        endpoint_url=f'https://s3.{AWS_REGION}.amazonaws.com'
    )

def generate_seo_filename(original_filename: str) -> str:
    """Generate SEO-friendly filename with collision prevention"""
    path = Path(original_filename)
    
    # Clean the stem (filename without extension)
    clean_stem = re.sub(r'[^a-zA-Z0-9-]', '-', path.stem.lower())
    clean_stem = re.sub(r'-+', '-', clean_stem).strip('-')  # Remove multiple dashes and edge dashes
    
    # Get extension (handles edge cases automatically)
    ext = path.suffix.lower() or '.jpg'  # Default to .jpg if no extension
    
    # Add hash for collision prevention
    short_hash = str(uuid.uuid4())[:8]
    
    return f"{clean_stem}-{short_hash}{ext}"

def get_public_url(s3_key: str) -> str:
    """Generate public URL for S3 object"""
    return f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

@router.post("/presigned")
async def get_presigned_url(
    request: PresignedUrlRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate pre-signed URL for direct S3 upload"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Validate image type only
    if request.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Only image files allowed. Supported: {list(ALLOWED_IMAGE_TYPES.keys())}"
        )
    
    # Generate SEO-friendly filename and S3 key
    seo_filename = generate_seo_filename(request.filename)
    s3_key = f"{user_id}/{request.blog_id}/{seo_filename}"
    
    try:
        s3_client = get_s3_client()
        
        # Generate pre-signed URL
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': request.content_type
            },
            ExpiresIn=900  # 15 minutes
        )
        
        return {
            "upload_url": presigned_url,
            "s3_key": s3_key,
            "public_url": get_public_url(s3_key)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Upload image to S3 and return URL"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate SEO-friendly filename
    seo_filename = generate_seo_filename(file.filename)
    s3_key = f"{user_id}/uploads/{seo_filename}"
    
    try:
        s3_client = get_s3_client()
        
        # Upload file
        s3_client.upload_fileobj(
            file.file,
            BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': file.content_type}
        )
        
        # Return public URL
        url = get_public_url(s3_key)
        return {"url": url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")