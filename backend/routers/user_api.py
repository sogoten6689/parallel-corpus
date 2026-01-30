from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_active_user
from crud import create_initial_users, get_user_by_email, create_user, get_users
from schemas.user import UserCreate, UserLogin, UserResponse, Token, UserUpdateBase, UserUpdateByAdminBase
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



@router.get("/users/{id}",)
def get_user_detail(id: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Lấy danh sách users (chỉ admin) / Get list of users (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập / Access denied"
        )
    user = db.query(User).filter(User.id == id).first()
    return {
        "data": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "date_of_birth": user.date_of_birth,
            "organization": user.organization,
            "role": user.role
        }
    }



@router.put("/users/{id}",)
def update_user(id: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user),  user_update: UserUpdateByAdminBase = UserUpdateByAdminBase):
    """Lấy danh sách users (chỉ admin) / Get list of users (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập / Access denied"
        )
    
    """Cập nhật thông tin user by id"""

    try:
        # Tìm user
        user = db.query(User).filter(User.id == id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Cập nhật các field
        if user_update.full_name:
            user.full_name = user_update.full_name
        if user_update.date_of_birth:
            user.date_of_birth = user_update.date_of_birth
        if user_update.organization:
            user.organization = user_update.organization
        if user_update.role:
            user.role = user_update.role

        # Lưu vào DB
        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "User updated successfully",
            "data": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "date_of_birth": user.date_of_birth,
                "organization": user.organization,
                "role": user.role
            }
        }
    
    except HTTPException:
        raise  # Bắn lại lỗi đã raise trước đó

    except Exception as e:
        db.rollback()  # Nếu có lỗi khi commit
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )
