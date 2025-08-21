from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MasterRowWordBase(BaseModel):
    row_word_id: Optional[str] = None
    id_sen: Optional[str] = None
    word: Optional[str] = None
    lemma: Optional[str] = None
    links: Optional[str] = None
    morph: Optional[str] = None
    pos: Optional[str] = None
    phrase: Optional[str] = None
    grm: Optional[str] = None
    ner: Optional[str] = None
    semantic: Optional[str] = None
    lang_code: Optional[str] = None
    create_by: Optional[int] = None
    approval_by: Optional[int] = None

class MasterRowWordCreate(MasterRowWordBase):
    pass

class MasterRowWordUpdate(MasterRowWordBase):
    pass

class MasterRowWord(MasterRowWordBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
