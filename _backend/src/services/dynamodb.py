import boto3
import os
from boto3.dynamodb.conditions import Key

class DynamoDBService:
    """
    DynamoDB Service for connecting FastAPI to DynamoDB (Local or AWS)
    
    Connection Flow:
    1. FastAPI app imports this service
    2. Service creates boto3 DynamoDB resource
    3. Resource points to local DynamoDB (port 8000) or AWS
    4. Service auto-creates tables if they don't exist
    5. API endpoints use service methods for database operations
    """
    
    def __init__(self):
        # Get DynamoDB endpoint from environment variable
        # Local: http://localhost:8000 (DynamoDB Local)
        # AWS: None (uses default AWS endpoint)
        endpoint_url = os.getenv('DYNAMODB_ENDPOINT')
        
        # DEPLOYMENT MAGIC: Single config change switches local ↔ production
        if endpoint_url:  # LOCAL DEVELOPMENT
            print(f"🔧 Using DynamoDB Local: {endpoint_url}")
            self.dynamodb = boto3.resource(
                'dynamodb',
                endpoint_url=endpoint_url,       # Points to DynamoDB Local
                region_name='us-east-1',
                aws_access_key_id='dummy',       # Fake credentials for local
                aws_secret_access_key='dummy'
            )
        else:  # PRODUCTION (AWS)
            print("☁️ Using AWS DynamoDB")
            self.dynamodb = boto3.resource(
                'dynamodb',
                region_name='us-east-1'          # Uses IAM role credentials automatically
            )
        
        
        # Table configuration (same for local and production)
        self.table_name = 'blog_posts'
        self.table = None
        
        # Ensure table exists (works for both local and AWS DynamoDB)
        self._ensure_table()
    
    def _ensure_table(self):
        """
        Check if table exists, create if it doesn't
        
        Connection Test Flow:
        1. Try to load existing table from DynamoDB
        2. If table exists: connection successful, ready to use
        3. If table missing: create new table automatically
        4. If connection fails: DynamoDB Local is not running
        """
        try:
            # Try to connect to existing table
            self.table = self.dynamodb.Table(self.table_name)
            self.table.load()  # This will fail if table doesn't exist
            print(f"✓ Connected to existing table: {self.table_name}")
        except Exception as e:
            print(f"Table not found, creating: {self.table_name}")
            self._create_table()
    
    def _create_table(self):
        """
        Create DynamoDB table with blog post schema
        
        Table Structure:
        - Primary Key: 'id' (String) - unique identifier for each blog post
        - Billing: PAY_PER_REQUEST (no capacity planning needed)
        """
        try:
            self.table = self.dynamodb.create_table(
                TableName=self.table_name,
                KeySchema=[
                    {'AttributeName': 'id', 'KeyType': 'HASH'}  # Partition key
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'id', 'AttributeType': 'S'}  # String type
                ],
                BillingMode='PAY_PER_REQUEST'  # On-demand billing
            )
            # Wait for table to be created before proceeding
            self.table.wait_until_exists()
            print(f"✓ Created new table: {self.table_name}")
        except Exception as e:
            print(f"✗ Failed to create table: {e}")
            raise
    
    # CRUD Operations - These methods are called by FastAPI endpoints
    
    def create_post(self, post_data):
        """
        Insert new blog post into DynamoDB
        
        Flow: FastAPI endpoint → this method → DynamoDB Local/AWS
        """
        try:
            response = self.table.put_item(Item=post_data)
            print(f"✓ Created post: {post_data.get('title', 'Unknown')}")
            return response
        except Exception as e:
            print(f"✗ Failed to create post: {e}")
            raise
    
    def get_post(self, post_id):
        """
        Retrieve single blog post by ID from DynamoDB
        
        Flow: FastAPI endpoint → this method → DynamoDB Local/AWS
        """
        try:
            response = self.table.get_item(Key={'id': post_id})
            item = response.get('Item')
            if item:
                print(f"✓ Retrieved post: {post_id}")
            else:
                print(f"✗ Post not found: {post_id}")
            return item
        except Exception as e:
            print(f"✗ Failed to get post: {e}")
            raise
    
    def list_posts(self):
        """
        Retrieve all blog posts from DynamoDB
        
        Flow: FastAPI endpoint → this method → DynamoDB Local/AWS
        Note: Uses scan() which reads entire table (fine for small datasets)
        """
        try:
            response = self.table.scan()
            items = response.get('Items', [])
            print(f"✓ Retrieved {len(items)} posts")
            return items
        except Exception as e:
            print(f"✗ Failed to list posts: {e}")
            raise