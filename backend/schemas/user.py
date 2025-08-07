from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional
from models.user import UserRole

class UserBase(BaseModel):
    username: str
    full_name: str
    date_of_birth: date
    organization: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 