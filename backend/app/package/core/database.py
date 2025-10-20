import boto3
import os
from typing import Optional, Dict, Any, List
from botocore.exceptions import ClientError
from .config import settings

# DynamoDB connection
def get_dynamodb_resource():
    """Get DynamoDB resource connection"""
    session = boto3.Session()
    if settings.AWS_PROFILE and settings.ENVIRONMENT == "development":
        session = boto3.Session(profile_name=settings.AWS_PROFILE)
    return session.resource('dynamodb', region_name=settings.AWS_REGION)

# Table references
dynamodb = get_dynamodb_resource()
users_table = dynamodb.Table(settings.DYNAMODB_TABLE_USERS)
blogs_table = dynamodb.Table(settings.DYNAMODB_TABLE_BLOGS)

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

# blog database operations
def create_blog(blog_data: Dict[str, Any]) -> bool:
    """Create a new blog"""
    try:
        blogs_table.put_item(Item=blog_data)
        return True
    except ClientError:
        return False

def get_blog_by_id(blog_id: str) -> Optional[Dict[str, Any]]:
    """Get blog by blog_id"""
    try:
        response = blogs_table.get_item(
            Key={'blog_id': blog_id, 'sk': 'METADATA'}
        )
        return response.get('Item')
    except ClientError:
        return None

def get_blog_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Get blog by slug using SlugIndex GSI"""
    try:
        response = blogs_table.query(
            IndexName='SlugIndex',
            KeyConditionExpression='slug = :slug',
            ExpressionAttributeValues={':slug': slug}
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError:
        return None

def get_published_blog() -> List[Dict[str, Any]]:
    """Get all published blog using StatusIndex GSI"""
    try:
        response = blogs_table.query(
            IndexName='StatusIndex',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'published'},
            ScanIndexForward=False
        )
        return response.get('Items', [])
    except ClientError:
        return []

def update_blog(blog_id: str, updates: Dict[str, Any]) -> bool:
    """Update blog data"""
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
            'Key': {'blog_id': blog_id, 'sk': 'METADATA'},
            'UpdateExpression': update_expr,
            'ExpressionAttributeValues': expr_values
        }
        
        if expr_names:
            update_params['ExpressionAttributeNames'] = expr_names
        
        blogs_table.update_item(**update_params)
        return True
    except ClientError:
        return False

def delete_blog(blog_id: str) -> bool:
    """Delete blog from database"""
    try:
        blogs_table.delete_item(
            Key={'blog_id': blog_id, 'sk': 'METADATA'}
        )
        return True
    except ClientError:
        return False

def get_user_blog(user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get blog by creator with optional status filter"""
    try:
        # Use boto3 Key for proper filtering
        from boto3.dynamodb.conditions import Attr
        
        response = blogs_table.scan(
            FilterExpression=Attr('user_id').eq(user_id)
        )
        
        blog = response.get('Items', [])
        
        # Filter by status if provided
        if status:
            blog = [a for a in blog if a.get('status') == status]
        
        # Sort by created_at descending
        blog.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return blog
    except ClientError as e:
        print(f"Database error: {e}")
        return []