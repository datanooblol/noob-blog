# FastAPI ↔ DynamoDB Local Connection Flow

## Overview
This document explains how FastAPI connects to DynamoDB Local for development.

## Connection Architecture

```
Client Request → FastAPI App → DynamoDB Service → DynamoDB Local Container
     ↓              ↓              ↓                    ↓
HTTP Request   Python Code    boto3 Library      Docker Container
localhost:3000  localhost:8001  localhost:8000     Port 8000
```

## Step-by-Step Connection Flow

### 1. **Startup Sequence**
```
1. DynamoDB Local starts in Docker container (port 8000)
2. FastAPI app starts (src/main.py)
3. FastAPI imports posts router (src/api/posts.py)
4. Posts router imports DynamoDBService (src/services/dynamodb.py)
5. DynamoDBService.__init__() runs and connects to localhost:8000
6. Service checks if 'blog_posts' table exists
7. If table missing, creates it automatically
8. FastAPI app is ready to handle requests
```

### 2. **Request Processing**
```
1. Client sends HTTP request to FastAPI (localhost:8001)
2. FastAPI route handler receives request
3. Route handler calls DynamoDBService method
4. DynamoDBService uses boto3 to communicate with DynamoDB Local
5. DynamoDB Local processes the database operation
6. Response flows back through the chain to client
```

## Key Configuration Points

### Environment Variables
```python
# In DynamoDBService.__init__()
endpoint_url = os.getenv('DYNAMODB_ENDPOINT', 'http://localhost:8000')
```

### Docker Compose Connection
```yaml
# docker-compose.yml
dynamodb-local:
  ports:
    - "8000:8000"  # Maps container port 8000 to host port 8000
```

### Boto3 Configuration
```python
# For LOCAL development
self.dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url='http://localhost:8000',  # Points to DynamoDB Local
    aws_access_key_id='dummy',             # Any value works locally
    aws_secret_access_key='dummy'          # Any value works locally
)
```

## Data Persistence

### Local Storage
- DynamoDB Local stores data in: `docker/dynamodb/` folder
- Data persists between container restarts
- Files are in binary format (not human-readable)

### Table Auto-Creation
```python
# In DynamoDBService._ensure_table()
try:
    self.table = self.dynamodb.Table('blog_posts')
    self.table.load()  # Test if table exists
except:
    self._create_table()  # Create if missing
```

## Testing the Connection

### 1. Verify DynamoDB Local is Running
```bash
curl http://localhost:8000/
# Should return DynamoDB Local info
```

### 2. Test FastAPI Connection
```bash
curl http://localhost:8001/
# Should return API status
```

### 3. Test Database Operations
```bash
# List posts (should return empty array initially)
curl http://localhost:8001/api/posts/

# Create a post
curl -X POST http://localhost:8001/api/posts/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","content":{},"meta_description":"Test","keywords":[],"published":false}'
```

## Troubleshooting

### Connection Issues
1. **DynamoDB Local not running**: Start with `docker-compose up -d dynamodb-local`
2. **Port conflicts**: Check if port 8000 is available
3. **Docker issues**: Ensure Docker Desktop is running

### Common Errors
- `ConnectionError`: DynamoDB Local container not running
- `ResourceNotFoundException`: Table doesn't exist (should auto-create)
- `ValidationException`: Invalid data format sent to DynamoDB

## Production vs Development

### Development (Current Setup)
- DynamoDB Local in Docker container
- Dummy AWS credentials
- Data stored locally in files
- No AWS account needed

### Production (Future)
- Real AWS DynamoDB service
- Real AWS credentials (IAM role/keys)
- Data stored in AWS cloud
- Remove `endpoint_url` parameter from boto3 config