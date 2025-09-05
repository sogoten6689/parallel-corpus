from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional
from models.user import UserRole

class UserBase(BaseModel):
    email: str
    full_name: str
    date_of_birth: date
    organization: str


class UserUpdateBase(BaseModel):
    full_name: str
    date_of_birth: date
    organization: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
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
    email: Optional[str] = None 