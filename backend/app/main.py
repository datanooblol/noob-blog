from fastapi import FastAPI, HTTPException
import boto3
import os
from botocore.exceptions import EndpointConnectionError
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from package.routers.auth.endpoint import router as auth_router
from package.routers.articles.endpoint import router as articles_router
from package.routers.upload.endpoint import router as upload_router


app = FastAPI()

# Environment-based CORS configuration
if os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    # Production Lambda environment
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
routers = [auth_router, articles_router, upload_router]
for router in routers:
    app.include_router(router)

# Environment-based AWS service connections
if os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    # Production Lambda environment - use real AWS services
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')
    cognito = boto3.client('cognito-idp')
else:
    # Local development - use LocalStack
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url='http://localhost:8000',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy',
        region_name='us-east-1'
    )
    s3 = boto3.client(
        's3',
        endpoint_url='http://localhost:4566',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy',
        region_name='us-east-1'
    )
    cognito = boto3.client(
        'cognito-idp',
        endpoint_url='http://localhost:4566',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy',
        region_name='us-east-1'
    )

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/dynamodb/tables")
def list_dynamodb_tables():
    try:
        return {"tables": [table.name for table in dynamodb.tables.all()]}
    except EndpointConnectionError:
        raise HTTPException(status_code=503, detail="DynamoDB not available. Run: docker-compose up dynamodb-local -d")

@app.get("/s3/buckets")
def list_s3_buckets():
    try:
        return s3.list_buckets()
    except EndpointConnectionError:
        raise HTTPException(status_code=503, detail="LocalStack not available. Run: docker-compose up localstack -d")

# @app.get("/cognito/user-pools")
# def list_user_pools():
#     try:
#         return cognito.list_user_pools(MaxResults=10)
#     except EndpointConnectionError:
#         raise HTTPException(status_code=503, detail="LocalStack not available. Run: docker-compose up localstack -d")

# Lambda handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True, workers=1)


