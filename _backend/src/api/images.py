from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.s3 import S3Service
import uuid

router = APIRouter(prefix="/images", tags=["images"])
s3_service = S3Service()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload image for blog posts
    
    Local: Saves to LocalStack S3 (localhost:4566)
    Production: Saves to AWS S3
    Same code, different storage!
    """
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    # Read file content
    file_content = await file.read()
    
    # Upload to S3 (LocalStack or AWS)
    image_url = s3_service.upload_image(
        file_content=file_content,
        file_name=unique_filename,
        content_type=file.content_type
    )
    
    return {
        "filename": unique_filename,
        "url": image_url,
        "size": len(file_content)
    }