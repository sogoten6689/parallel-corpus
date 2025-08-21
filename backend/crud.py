from sqlalchemy.orm import Session
from models.row_word import RowWord
from models.master_row_word import MasterRowWord
from models.user import User, UserRole
from schemas.rowword import RowWordCreate
from schemas.word_row_master import MasterRowWordCreate
from schemas.user import UserCreate
from auth import get_password_hash
from datetime import datetime


def create_row_word(db: Session, word: RowWordCreate):
    db_word = RowWord(**word.dict())
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word

def get_all_row_words(db: Session):
    return db.query(RowWord).all()

# User CRUD operations
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate, role: UserRole = UserRole.USER):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
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
            "email": "lananh@gmail.com",
            "password": "lananh123",
            "full_name": "Nguyễn Thị Lan Anh",
            "date_of_birth": "1995-05-15",
            "organization": "HCMUS",
            "role": UserRole.USER
        },
        {
            "email": "sogoten6689@gmail.com",
            "password": "Lam@123456",
            "full_name": "Nguyễn Ngọc Lâm",
            "date_of_birth": "1997-04-06",
            "organization": "HCMUS",
            "role": UserRole.USER
        },
        {
            "email": "thang@gmail.com",
            "password": "thang123",
            "full_name": "La Quốc Thắng",
            "date_of_birth": "1988-12-10",
            "organization": "HCMUS",
            "role": UserRole.USER
        },
        {
            "email": "admin@gmail.com",
            "password": "admin123",
            "full_name": "Administrator",
            "date_of_birth": "1990-01-01",
            "organization": "HCMUS",
            "role": UserRole.ADMIN
        }
    ]
    
    for user_data in users_data:
        existing_user = get_user_by_email(db, user_data["email"])
        if not existing_user:
            user_create = UserCreate(**user_data)
            create_user(db, user_create, user_data["role"])
            print(f"Created user: {user_data['email']}")
        else:
            print(f"User {user_data['email']} already exists")

# MasterRowWord CRUD operations
def create_word_row_master(db: Session, word_data: MasterRowWordCreate, creator_id: int = None):
    db_word = MasterRowWord(**word_data.dict())
    db_word.create_by = creator_id
    db_word.created_at = datetime.now()
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word

def get_all_word_row_masters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(MasterRowWord).offset(skip).limit(limit).all()

def get_word_row_masters_by_lang(db: Session, lang_code: str, skip: int = 0, limit: int = 100):
    return db.query(MasterRowWord).filter(MasterRowWord.lang_code == lang_code).offset(skip).limit(limit).all()

def migrate_row_words_to_word_row_master(db: Session, creator_id: int = None):
    """Migrate all data from row_words to word_row_master"""
    row_words = db.query(RowWord).all()
    migrated_count = 0
    
    for row_word in row_words:
        # Check if already exists
        existing = db.query(MasterRowWord).filter(MasterRowWord.row_word_id == row_word.ID).first()
        if not existing:
            word_master = MasterRowWord(
                row_word_id=row_word.ID,
                id_sen=row_word.ID_sen,
                word=row_word.Word,
                lemma=row_word.Lemma,
                links=row_word.Links,
                morph=row_word.Morph,
                pos=row_word.POS,
                phrase=row_word.Phrase,
                grm=row_word.Grm,
                ner=row_word.NER,
                semantic=row_word.Semantic,
                lang_code=row_word.Lang_code,
                create_by=creator_id,
                created_at=datetime.now()
            )
            db.add(word_master)
            migrated_count += 1
    
    db.commit()
    return migrated_count