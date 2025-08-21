from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.word_row_master import MasterRowWord, MasterRowWordCreate
from crud import (
    create_word_row_master, 
    get_all_word_row_masters, 
    get_word_row_masters_by_lang,
    migrate_row_words_to_word_row_master
)
from typing import List, Optional

router = APIRouter(prefix="/word-row-master", tags=["word-row-master"])

@router.get("/", response_model=List[MasterRowWord])
def get_word_row_masters(
    lang_code: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all word row masters with optional language filter"""
    if lang_code:
        return get_word_row_masters_by_lang(db, lang_code, skip, limit)
    return get_all_word_row_masters(db, skip, limit)

@router.post("/", response_model=MasterRowWord)
def create_word_row_master_endpoint(
    word_data: MasterRowWordCreate, 
    db: Session = Depends(get_db)
):
    """Create a new word row master"""
    return create_word_row_master(db, word_data)

@router.post("/migrate-from-row-words/")
def migrate_data_from_row_words(db: Session = Depends(get_db)):
    """Migrate all data from row_words table to word_row_master table"""
    try:
        migrated_count = migrate_row_words_to_word_row_master(db)
        return {
            "message": f"Successfully migrated {migrated_count} records from row_words to word_row_master",
            "migrated_count": migrated_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

@router.get("/count")
def get_word_row_master_count(
    lang_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get count of records in word_row_master"""
    from models.master_row_word import MasterRowWord
    
    query = db.query(MasterRowWord)
    if lang_code:
        query = query.filter(MasterRowWord.lang_code == lang_code)
    
    total = query.count()
    return {"total": total, "lang_code": lang_code}
