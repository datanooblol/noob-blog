from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from package.models.user import UserRegister, UserLogin, UserResponse, TokenResponse
from package.routers.auth.services import register_user, authenticate_user, get_current_user
from package.core.auth import get_user_id_from_token

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister):
    """Register a new user"""
    user = register_user(user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists"
        )
    
    # Auto-login after registration
    auth_result = authenticate_user(user_data.email, user_data.password)
    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration successful but login failed"
        )
    
    return TokenResponse(**auth_result)

@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin):
    """Login user"""
    auth_result = authenticate_user(user_data.email, user_data.password)
    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return TokenResponse(**auth_result)

@router.get("/me", response_model=UserResponse)
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user profile"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = get_current_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user