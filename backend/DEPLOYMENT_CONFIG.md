# Development vs Production Configuration

## Current Development Setup
```python
# DynamoDBService connects to LOCAL DynamoDB
endpoint_url = 'http://localhost:8000'  # DynamoDB Local
aws_access_key_id = 'dummy'             # Fake credentials
aws_secret_access_key = 'dummy'         # Fake credentials
```

## Production Deployment Changes

### Option 1: Environment Variables (Recommended)
```bash
# Remove or don't set DYNAMODB_ENDPOINT for production
# AWS credentials handled by IAM role (Lambda) or AWS profile
unset DYNAMODB_ENDPOINT
```

### Option 2: Code Changes (Minimal)
```python
# In dynamodb.py - modify __init__ method:
def __init__(self):
    endpoint_url = os.getenv('DYNAMODB_ENDPOINT')  # None for production
    
    if endpoint_url:  # Local development
        self.dynamodb = boto3.resource(
            'dynamodb',
            endpoint_url=endpoint_url,
            region_name='us-east-1',
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
    else:  # Production (AWS)
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
```

## That's It!

### Development:
1. Start DynamoDB Local: `docker-compose up -d dynamodb-local`
2. Start FastAPI: `uvicorn src.main:app --reload`
3. Code uses local database

### Production:
1. Deploy to AWS Lambda (CDK handles DynamoDB creation)
2. Remove `DYNAMODB_ENDPOINT` environment variable
3. Same code automatically uses AWS DynamoDB

**Zero business logic changes needed!**