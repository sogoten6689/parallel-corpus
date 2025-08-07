from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_active_user
from crud import get_user_by_username, create_user, get_users
from schemas.user import UserCreate, UserResponse, Token
from models.user import UserRole, User

router = APIRouter()

@router.post("/sign-up", response_model=UserResponse)
def sign_up(user: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới / Register new account"""
    # Kiểm tra username đã tồn tại chưa / Check if username already exists
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username đã tồn tại / Username already exists"
        )
    
    # Tạo user mới / Create new user
    return create_user(db=db, user=user)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Đăng nhập / Login"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng / Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Lấy thông tin user hiện tại / Get current user information"""
    return current_user

@router.get("/users", response_model=list[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Lấy danh sách users (chỉ admin) / Get list of users (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập / Access denied"
        )
    users = get_users(db, skip=skip, limit=limit)
    return users 