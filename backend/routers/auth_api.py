from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_active_user, add_token_to_blacklist
from crud import get_user_by_email, create_user, get_users
from schemas.user import UserCreate, UserLogin, UserResponse, Token
from models.user import UserRole, User

router = APIRouter()

@router.post("/sign-up", response_model=UserResponse)
def sign_up(user: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới / Register new account"""
    # Kiểm tra email đã tồn tại chưa / Check if email already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email đã tồn tại / email already exists"
        )
    
    # Tạo user mới / Create new user
    return create_user(db=db, user=user)

@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    """Đăng nhập / Login"""
    # return body
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên email hoặc mật khẩu không đúng / Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Lấy thông tin user hiện tại / Get current user information"""
    return current_user

@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_active_user)):
    """Đăng xuất / Logout"""
    try:
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authorization header"
            )
        
        token = auth_header.split(" ")[1]
        
        # Add token to blacklist
        add_token_to_blacklist(token)
        
        return {
            "message": "Đăng xuất thành công / Logout successful",
            "user_email": current_user.email,
            "token_revoked": True,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi đăng xuất / Error during logout"
        )
