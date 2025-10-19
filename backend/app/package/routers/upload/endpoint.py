import boto3
import uuid
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from package.core.auth import get_user_id_from_token

router = APIRouter(prefix="/upload", tags=["upload"])
security = HTTPBearer()

# S3 client for LocalStack
def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url='http://localhost:4566',
        aws_access_key_id='test',
        aws_secret_access_key='test',
        region_name='us-east-1'
    )

BUCKET_NAME = 'blog-images'

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
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    try:
        s3_client = get_s3_client()
        
        # Create bucket if it doesn't exist
        try:
            s3_client.head_bucket(Bucket=BUCKET_NAME)
        except:
            s3_client.create_bucket(Bucket=BUCKET_NAME)
        
        # Upload file
        s3_client.upload_fileobj(
            file.file,
            BUCKET_NAME,
            unique_filename,
            ExtraArgs={'ContentType': file.content_type}
        )
        
        # Return public URL
        url = f"http://localhost:4566/{BUCKET_NAME}/{unique_filename}"
        return {"url": url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")