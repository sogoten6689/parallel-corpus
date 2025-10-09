from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import TokenData, UserUpdateBase

# Configuration
SECRET_KEY = "your-secret-key-here-change-in-production"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], default="argon2", deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Simple in-memory token blacklist for logout
TOKEN_BLACKLIST = set()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def add_token_to_blacklist(token: str):
    """Add token to blacklist when user logs out"""
    TOKEN_BLACKLIST.add(token)

def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted"""
    return token in TOKEN_BLACKLIST

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if token is blacklisted
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked - please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user 

async def update_current_user(current_user: User = Depends(get_current_user)):
    return current_user
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        return None  # hoặc raise HTTPException(status_code=404, detail="User not found")
    
    return user

    # 2. Cập nhật các field
    user.full_name = update_user.full_name
    user.date_of_birth = update_user.date_of_birth
    user.organization = update_user.organization

    # 3. Lưu vào DB
    db.add(user)
    db.commit()
    db.refresh(user)  # để lấy dữ liệu mới nhất từ DB


    db.commit()
    return user