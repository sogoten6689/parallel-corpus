from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class MasterRowWord(Base):
    __tablename__ = "master_row_words"

    id = Column(Integer, primary_key=True, index=True)
    id_string = Column(String)
    row_word_id = Column(String, ForeignKey("row_words.id"))
    id_sen = Column(String)
    word = Column(String)
    lemma = Column(String)
    links = Column(String)
    morph = Column(String)
    pos = Column(String)
    phrase = Column(String)
    grm = Column(String)
    ner = Column(String)
    semantic = Column(String)
    lang_code = Column(String)
    create_by = Column(Integer, ForeignKey("users.id"))
    approval_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    row_word = relationship("RowWord")
    creator = relationship("User", foreign_keys=[create_by])
    approver = relationship("User", foreign_keys=[approval_by])
