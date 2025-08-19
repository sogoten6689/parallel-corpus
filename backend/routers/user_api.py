from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_active_user
from crud import get_user_by_email, create_user, get_users
from schemas.user import UserCreate, UserLogin, UserResponse, Token
from models.user import UserRole, User
from sqlalchemy import or_


router = APIRouter()

@router.get("/users",)
def read_users(limit: int = 10, search: str = '', page: int = 1, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Lấy danh sách users (chỉ admin) / Get list of users (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập / Access denied"
        )
    query = db.query(User)
    if search != '':
        query = query.filter(
            or_(
                User.email.ilike(f'%{search}%'),
                User.full_name.ilike(f'%{search}%')
            )
        )

    total = query.count()
    total_pages = (total + limit - 1) // limit

    data = query.offset((page - 1) * limit).limit(limit).all()

    for u in data:
        if hasattr(u, 'hashed_password'):
            del u.__dict__['hashed_password']

    return {"data": data, "page": page, "limit": limit, "total": total, "total_pages": total_pages}
    # users = get_users(db, skip=skip, limit=limit)
    # total = db.query(User).count()
    # return users 