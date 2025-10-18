# Simple Step-by-Step Local Setup

## What We're Building
```
Your Computer:
├── DynamoDB Local (port 8000) - stores blog posts
├── LocalStack S3 (port 4566) - stores images  
└── FastAPI (port 8001) - your API that talks to both
```

## Step 1: Start Just DynamoDB Local

### Option A: With Docker (Recommended)
```bash
cd docker
docker-compose up -d dynamodb-local
```

### Option B: Without Docker
```bash
# Run the batch file we created earlier
scripts\start-dynamodb-local.bat
```

### Test DynamoDB is Running
Open browser: http://localhost:8000
You should see DynamoDB Local info page.

## Step 2: Test FastAPI with DynamoDB

```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8001
```

### Test the Connection
Open browser: http://localhost:8001
You should see: `{"message": "Noob Blog API is running"}`

### Test Creating a Blog Post
```bash
curl -X POST http://localhost:8001/api/posts/ \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Post","slug":"my-first-post","content":{},"meta_description":"Test post","keywords":["test"],"published":false}'
```

### Test Getting Blog Posts
```bash
curl http://localhost:8001/api/posts/
```

You should see your blog post in the response!

## That's It for DynamoDB!

Your blog posts are now stored locally and will persist even if you restart the containers.