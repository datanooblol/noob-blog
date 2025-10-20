import os
from dotenv import load_dotenv

def load_environment():
    """Load environment variables based on current environment"""
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Only load .env files in development (AWS won't have these files)
    if environment == "development":
        load_dotenv(".env.local", override=True)
    # In production, AWS Lambda environment variables are used directly

# Load environment on import
load_environment()

# Configuration class
class Settings:
    AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
    AWS_PROFILE = os.getenv("AWS_PROFILE")
    DYNAMODB_TABLE_BLOGS = os.getenv("DYNAMODB_TABLE_BLOGS", "Blogs")
    DYNAMODB_TABLE_USERS = os.getenv("DYNAMODB_TABLE_USERS", "Users")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

settings = Settings()