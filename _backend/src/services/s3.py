import boto3
import os
from botocore.exceptions import ClientError

class S3Service:
    """
    S3 Service for image storage (Local or AWS)
    
    Local Development: Uses LocalStack S3 (port 4566)
    Production: Uses real AWS S3
    Same boto3 code works for both!
    """
    
    def __init__(self):
        # Get S3 endpoint from environment
        endpoint_url = os.getenv('S3_ENDPOINT')
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'noob-blog-images')
        
        if endpoint_url:  # LOCAL DEVELOPMENT
            print(f"🔧 Using LocalStack S3: {endpoint_url}")
            self.s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id='dummy',
                aws_secret_access_key='dummy',
                region_name='us-east-1'
            )
        else:  # PRODUCTION (AWS)
            print("☁️ Using AWS S3")
            self.s3_client = boto3.client('s3', region_name='us-east-1')
        
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Create bucket if it doesn't exist (works for LocalStack and AWS)"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            print(f"✓ Connected to bucket: {self.bucket_name}")
        except ClientError:
            print(f"Creating bucket: {self.bucket_name}")
            self.s3_client.create_bucket(Bucket=self.bucket_name)
    
    def upload_image(self, file_content, file_name, content_type='image/jpeg'):
        """Upload image to S3 (LocalStack or AWS)"""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=f"images/{file_name}",
                Body=file_content,
                ContentType=content_type
            )
            
            # Generate URL (different for local vs production)
            if os.getenv('S3_ENDPOINT'):  # Local
                url = f"http://localhost:4566/{self.bucket_name}/images/{file_name}"
            else:  # AWS
                url = f"https://{self.bucket_name}.s3.amazonaws.com/images/{file_name}"
            
            print(f"✓ Uploaded image: {file_name}")
            return url
        except Exception as e:
            print(f"✗ Failed to upload image: {e}")
            raise