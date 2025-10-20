from fastapi import FastAPI, HTTPException

from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from package.core.config import settings
from package.routers.auth.endpoint import router as auth_router
from package.routers.blog.endpoint import router as blog_router
from package.routers.upload.endpoint import router as upload_router
from dotenv import load_dotenv
load_dotenv(override=True)

app = FastAPI()

# Environment-based CORS configuration
if settings.ENVIRONMENT == "production":
    # Production environment
    allowed_origins = [
        "https://yourdomain.com",  # Replace with your actual domain
        "https://www.yourdomain.com"
    ]
else:
    # Local development
    allowed_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
routers = [auth_router, blog_router, upload_router]
for router in routers:
    app.include_router(router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Lambda handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, workers=1)


