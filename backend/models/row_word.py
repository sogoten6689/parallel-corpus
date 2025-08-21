from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String
from .base import Base

class RowWord(Base):
    __tablename__ = "row_words"

    id = Column(String, primary_key=True, index=True)
    id_sen = Column(String, index=True)
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
