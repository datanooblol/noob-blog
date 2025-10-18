from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

# Request models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

# Response models
class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    display_name: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool
    email_verified: bool
    created_at: str
    updated_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse