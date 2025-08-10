from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
from models.user import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.get("/import/check-auth", 
    summary="Check Import Authentication",
    description="Verify if the current user is authenticated to use import functionality. Returns user information if authenticated, otherwise returns a login requirement message.",
    response_description="Authentication status and user information"
)
async def check_import_auth(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng import / Please login to use import functionality",
                "requires_login": True,
                "login_url": "/auth/login"
            }
        )
    
    return {
        "message": "Đã đăng nhập thành công / Successfully authenticated",
        "requires_login": False,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value if current_user.role else None,
            "organization": current_user.organization,
            "work_unit": getattr(current_user, 'work_unit', None),
            "status": getattr(current_user, 'status', None)
        }
    }

@router.post("/import/upload",
    summary="Upload/Import Data",
    description="Upload and import data files. This endpoint requires authentication and is only available to logged-in users.",
    response_description="Import operation status and user confirmation"
)
async def import_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng import / Please login to use import functionality",
                "requires_login": True,
                "login_url": "/auth/login"
            }
        )
    
    # TODO: Implement actual import logic here
    return {
        "message": "Import functionality ready",
        "user_id": current_user.id,
        "user_email": current_user.email,
        "status": "authenticated"
    }

@router.get("/import/status",
    summary="Get Import Status",
    description="Retrieve the current import status and available features. Returns different information based on authentication status. If not authenticated, shows login requirements.",
    response_description="Import status and available features"
)
async def get_import_status(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {
            "authenticated": False,
            "message": "Vui lòng đăng nhập để xem trạng thái import / Please login to view import status",
            "requires_login": True,
            "login_url": "/auth/login",
            "available_features": []
        }
    
    return {
        "authenticated": True,
        "message": "Đã đăng nhập thành công / Successfully authenticated",
        "requires_login": False,
        "user_info": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value if current_user.role else None
        },
        "available_features": [
            "upload_files",
            "import_data",
            "view_status",
            "manage_imports"
        ]
    }
