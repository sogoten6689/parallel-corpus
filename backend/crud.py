from sqlalchemy.orm import Session
from models.sentence import Sentence
from models.point import Point
from models.rowword import RowWord
from models.user import User, UserRole
from schemas.sentence import SentenceCreate
from schemas.point import PointCreate
from schemas.rowword import RowWordCreate
from schemas.user import UserCreate
from auth import get_password_hash


def create_row_word(db: Session, word: RowWordCreate):
    db_word = RowWord(**word.dict())
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word

def get_all_row_words(db: Session):
    return db.query(RowWord).all()

# User CRUD operations
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate, role: UserRole = UserRole.USER):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        date_of_birth=user.date_of_birth,
        organization=user.organization,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_initial_users(db: Session):
    """Create initial users: lananh, lam, thang, admin"""
    users_data = [
        {
            "username": "lananh",
            "password": "lananh123",
            "full_name": "Nguyễn Thị Lan Anh",
            "date_of_birth": "1995-05-15",
            "organization": "HCMUS",
            "role": UserRole.USER
        },
        {
            "username": "lam",
            "password": "lam123",
            "full_name": "Nguyễn Ngọc Lâm",
            "date_of_birth": "1990-08-20",
            "organization": "HCMUS",
            "role": UserRole.USER
        },
        {
            "username": "thang",
            "password": "thang123",
            "full_name": "La Quốc Thắng",
            "date_of_birth": "1988-12-10",
            "organization": "HCMUS",
            "role": UserRole.USER
        },
        {
            "username": "admin",
            "password": "admin123",
            "full_name": "Administrator",
            "date_of_birth": "1990-01-01",
            "organization": "HCMUS",
            "role": UserRole.ADMIN
        }
    ]
    
    for user_data in users_data:
        existing_user = get_user_by_username(db, user_data["username"])
        if not existing_user:
            user_create = UserCreate(**user_data)
            create_user(db, user_create, user_data["role"])
            print(f"Created user: {user_data['username']}")
        else:
            print(f"User {user_data['username']} already exists")