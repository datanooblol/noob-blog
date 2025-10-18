from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.posts import router as posts_router
from .api.images import router as images_router

# FastAPI Application Entry Point
# This is where the connection chain starts:
# 1. FastAPI app starts
# 2. Imports posts_router
# 3. posts_router imports DynamoDBService
# 4. DynamoDBService connects to DynamoDB Local (localhost:8000)
app = FastAPI(title="Noob Blog API", version="1.0.0")

print("Starting Noob Blog API...")
print("Expected DynamoDB Local: http://localhost:8000")
print("API will be available at: http://localhost:8001")

# CORS middleware for frontend communication
# Allows Next.js frontend (localhost:3000) to call this API (localhost:8001)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(posts_router, prefix="/api")
app.include_router(images_router, prefix="/api")

@app.get("/")
async def root():
    """
    API status endpoint
    Test this first to verify FastAPI is running: GET http://localhost:8001/
    """
    return {
        "message": "Noob Blog API is running",
        "dynamodb_endpoint": "http://localhost:8000",
        "api_docs": "http://localhost:8001/docs"
    }

@app.get("/health")
async def health():
    """
    Health check endpoint
    Use this to verify API is responding: GET http://localhost:8001/health
    """
    return {"status": "healthy"}