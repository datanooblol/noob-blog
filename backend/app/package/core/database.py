import boto3
import os
from typing import Optional, Dict, Any, List
from botocore.exceptions import ClientError

# DynamoDB connection
def get_dynamodb_resource():
    """Get DynamoDB resource connection"""
    return boto3.resource(
        'dynamodb',
        endpoint_url=os.getenv('DYNAMODB_ENDPOINT', 'http://localhost:8000'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', 'dummy'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', 'dummy'),
        region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
    )

# Table references
dynamodb = get_dynamodb_resource()
users_table = dynamodb.Table('Users')
articles_table = dynamodb.Table('Articles')

# User database operations
def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by user_id"""
    try:
        response = users_table.get_item(
            Key={'user_id': user_id, 'sk': 'PROFILE'}
        )
        return response.get('Item')
    except ClientError:
        return None

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email using EmailIndex GSI"""
    try:
        response = users_table.query(
            IndexName='EmailIndex',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': email}
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError:
        return None

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username using UsernameIndex GSI"""
    try:
        response = users_table.query(
            IndexName='UsernameIndex',
            KeyConditionExpression='username = :username',
            ExpressionAttributeValues={':username': username}
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError:
        return None

def create_user(user_data: Dict[str, Any]) -> bool:
    """Create a new user"""
    try:
        users_table.put_item(Item=user_data)
        return True
    except ClientError:
        return False

def update_user(user_id: str, updates: Dict[str, Any]) -> bool:
    """Update user data"""
    try:
        # Build update expression
        update_expr = "SET "
        expr_values = {}
        
        for key, value in updates.items():
            update_expr += f"{key} = :{key}, "
            expr_values[f":{key}"] = value
        
        update_expr = update_expr.rstrip(", ")
        
        users_table.update_item(
            Key={'user_id': user_id, 'sk': 'PROFILE'},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values
        )
        return True
    except ClientError:
        return False

# Article database operations
def create_article(article_data: Dict[str, Any]) -> bool:
    """Create a new article"""
    try:
        articles_table.put_item(Item=article_data)
        return True
    except ClientError:
        return False

def get_article_by_id(article_id: str) -> Optional[Dict[str, Any]]:
    """Get article by article_id"""
    try:
        response = articles_table.get_item(
            Key={'article_id': article_id, 'sk': 'METADATA'}
        )
        return response.get('Item')
    except ClientError:
        return None

def get_article_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Get article by slug using SlugIndex GSI"""
    try:
        response = articles_table.query(
            IndexName='SlugIndex',
            KeyConditionExpression='slug = :slug',
            ExpressionAttributeValues={':slug': slug}
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError:
        return None

def get_published_articles() -> List[Dict[str, Any]]:
    """Get all published articles using StatusIndex GSI"""
    try:
        response = articles_table.query(
            IndexName='StatusIndex',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'published'},
            ScanIndexForward=False
        )
        return response.get('Items', [])
    except ClientError:
        return []

def update_article(article_id: str, updates: Dict[str, Any]) -> bool:
    """Update article data"""
    try:
        update_expr = "SET "
        expr_values = {}
        expr_names = {}
        
        for key, value in updates.items():
            # Handle reserved words
            if key == 'status':
                update_expr += f"#status = :status, "
                expr_names['#status'] = 'status'
                expr_values[':status'] = value
            else:
                update_expr += f"{key} = :{key}, "
                expr_values[f":{key}"] = value
        
        update_expr = update_expr.rstrip(", ")
        
        # Build update_item parameters
        update_params = {
            'Key': {'article_id': article_id, 'sk': 'METADATA'},
            'UpdateExpression': update_expr,
            'ExpressionAttributeValues': expr_values
        }
        
        if expr_names:
            update_params['ExpressionAttributeNames'] = expr_names
        
        articles_table.update_item(**update_params)
        return True
    except ClientError:
        return False

def delete_article(article_id: str) -> bool:
    """Delete article from database"""
    try:
        articles_table.delete_item(
            Key={'article_id': article_id, 'sk': 'METADATA'}
        )
        return True
    except ClientError:
        return False

def get_user_articles(creator_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get articles by creator with optional status filter"""
    try:
        # Use boto3 Key for proper filtering
        from boto3.dynamodb.conditions import Attr
        
        response = articles_table.scan(
            FilterExpression=Attr('creator_id').eq(creator_id)
        )
        
        articles = response.get('Items', [])
        
        # Filter by status if provided
        if status:
            articles = [a for a in articles if a.get('status') == status]
        
        # Sort by created_at descending
        articles.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return articles
    except ClientError as e:
        print(f"Database error: {e}")
        return []