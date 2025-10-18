from fastapi import APIRouter, HTTPException
from ..models.blog_post import BlogPost
from ..services.dynamodb import DynamoDBService

# FastAPI Router for blog post endpoints
router = APIRouter(prefix="/posts", tags=["posts"])

# Initialize DynamoDB service connection
# This creates the connection to DynamoDB Local (localhost:8000) when the module loads
# Connection Flow:
# 1. FastAPI app starts
# 2. This module imports DynamoDBService
# 3. DynamoDBService.__init__() runs and connects to DynamoDB
# 4. Service auto-creates 'blog_posts' table if it doesn't exist
# 5. All API endpoints use this single db_service instance
print("Initializing DynamoDB connection...")
db_service = DynamoDBService()
print("DynamoDB service ready!")

# API Endpoints - These handle HTTP requests and use DynamoDB service

@router.post("/", response_model=BlogPost)
async def create_post(post: BlogPost):
    """
    Create new blog post
    
    Request Flow:
    1. Client sends POST request with blog post data
    2. FastAPI validates data using BlogPost model
    3. Convert Pydantic model to dictionary
    4. Call db_service.create_post() → DynamoDB Local
    5. Return created post to client
    """
    print(f"API: Creating post '{post.title}'")
    post_dict = post.model_dump()  # Convert Pydantic model to dict for DynamoDB
    db_service.create_post(post_dict)  # Save to DynamoDB Local
    return post

@router.get("/{post_id}", response_model=BlogPost)
async def get_post(post_id: str):
    """
    Get single blog post by ID
    
    Request Flow:
    1. Client sends GET request with post ID in URL
    2. Call db_service.get_post() → DynamoDB Local
    3. If post exists: return it, if not: return 404 error
    """
    print(f"API: Getting post {post_id}")
    post = db_service.get_post(post_id)  # Query DynamoDB Local
    if not post:
        print(f"API: Post {post_id} not found")
        raise HTTPException(status_code=404, detail="Post not found")
    return BlogPost(**post)  # Convert dict back to Pydantic model

@router.get("/")
async def list_posts():
    """
    Get all blog posts
    
    Request Flow:
    1. Client sends GET request to /posts/
    2. Call db_service.list_posts() → DynamoDB Local
    3. Convert all posts from dict to Pydantic models
    4. Return list of posts to client
    """
    print("API: Listing all posts")
    posts = db_service.list_posts()  # Scan DynamoDB Local table
    return [BlogPost(**post) for post in posts]  # Convert to Pydantic models