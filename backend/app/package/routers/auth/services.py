import uuid
from datetime import datetime, timezone
from typing import Optional
from package.core.auth import hash_password, verify_password, create_access_token
from package.core.database import (
    get_user_by_email, 
    get_user_by_username, 
    create_user,
    get_user_by_id
)
from package.models.user import UserRegister, UserResponse

def register_user(user_data: UserRegister) -> Optional[UserResponse]:
    """Register a new user"""
    # Check if email already exists
    if get_user_by_email(user_data.email):
        return None
    
    # Check if username already exists
    if get_user_by_username(user_data.username):
        return None
    
    # Create user record
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_record = {
        'user_id': user_id,
        'sk': 'PROFILE',
        'username': user_data.username,
        'email': user_data.email,
        'password_hash': hash_password(user_data.password),
        'display_name': user_data.display_name,
        'bio': '',
        'avatar': '',
        'is_active': True,
        'email_verified': False,
        'created_at': now,
        'updated_at': now
    }
    
    # Save to database
    if create_user(user_record):
        return UserResponse(
            user_id=user_id,
            username=user_data.username,
            email=user_data.email,
            display_name=user_data.display_name,
            bio='',
            avatar='',
            is_active=True,
            email_verified=False,
            created_at=now,
            updated_at=now
        )
    return None

def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate user and return user data with token"""
    # Get user by email
    user = get_user_by_email(email)
    if not user:
        return None
    
    # Verify password
    if not verify_password(password, user['password_hash']):
        return None
    
    # Check if user is active
    if not user.get('is_active', True):
        return None
    
    # Create access token
    token = create_access_token({"sub": user['user_id']})
    
    # Return user data and token
    user_response = UserResponse(
        user_id=user['user_id'],
        username=user['username'],
        email=user['email'],
        display_name=user['display_name'],
        bio=user.get('bio', ''),
        avatar=user.get('avatar', ''),
        is_active=user['is_active'],
        email_verified=user.get('email_verified', False),
        created_at=user['created_at'],
        updated_at=user['updated_at']
    )
    
    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': user_response
    }

def get_current_user(user_id: str) -> Optional[UserResponse]:
    """Get current user by ID"""
    user = get_user_by_id(user_id)
    if not user:
        return None
    
    return UserResponse(
        user_id=user['user_id'],
        username=user['username'],
        email=user['email'],
        display_name=user['display_name'],
        bio=user.get('bio', ''),
        avatar=user.get('avatar', ''),
        is_active=user['is_active'],
        email_verified=user.get('email_verified', False),
        created_at=user['created_at'],
        updated_at=user['updated_at']
    )