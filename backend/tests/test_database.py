#!/usr/bin/env python3
"""
Test Database operations and models
"""
import pytest
import sys
import os
from datetime import date, datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, SessionLocal
from models import User, RowWord, Sentence, Point, UserRole
from crud import (
    get_user_by_username, get_user_by_id, get_users, create_user,
    get_all_row_words, create_row_word
)
from schemas import UserCreate, RowWordCreate

class TestDatabase:
    """Test class for database operations"""
    
    def test_database_connection(self):
        """Test database connection"""
        db = SessionLocal()
        # Try to execute a simple query
        result = db.execute(text("SELECT 1"))
        assert result.scalar() == 1
        db.close()
    
    def test_user_model(self):
        """Test User model creation"""
        db = SessionLocal()
        test_user = User(
            username="test_db_user",
            hashed_password="hashed_password_123",
            full_name="Test DB User",
            date_of_birth=date(1990, 1, 1),
            organization="Test Organization",
            role=UserRole.USER
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        assert test_user.id is not None
        assert test_user.username == "test_db_user"
        assert test_user.role == UserRole.USER
        db.delete(test_user)
        db.commit()
        db.close()
    
    def test_rowword_model(self):
        """Test RowWord model creation"""
        db = SessionLocal()
        test_rowword = RowWord(
            ID="test_db_word_001",
            ID_sen="test_db_sentence_001",
            Word="testword",
            Lemma="testword",
            Links="1:2",
            Morph="POS=NOUN",
            POS="NOUN",
            Phrase="NP",
            Grm="root",
            NER="O",
            Semantic="test",
            Lang_code="en"
        )
        db.add(test_rowword)
        db.commit()
        db.refresh(test_rowword)
        assert test_rowword.ID == "test_db_word_001"
        assert test_rowword.Word == "testword"
        assert test_rowword.Lang_code == "en"
        db.delete(test_rowword)
        db.commit()
        db.close()
    
    def test_sentence_model(self):
        """Test Sentence model creation"""
        db = SessionLocal()
        test_sentence = Sentence(
            id_sen="test_db_sentence_001",
            left="Previous context",
            center="Main sentence content",
            right="Following context"
        )
        db.add(test_sentence)
        db.commit()
        db.refresh(test_sentence)
        assert test_sentence.id_sen == "test_db_sentence_001"
        assert test_sentence.center == "Main sentence content"
        db.delete(test_sentence)
        db.commit()
        db.close()
    
    def test_point_model(self):
        """Test Point model creation"""
        db = SessionLocal()
        test_point = Point(
            startpos=0,
            endpos=5
        )
        db.add(test_point)
        db.commit()
        db.refresh(test_point)
        assert test_point.id is not None
        assert test_point.startpos == 0
        assert test_point.endpos == 5
        db.delete(test_point)
        db.commit()
        db.close()
    
    def test_crud_operations(self):
        """Test CRUD operations"""
        db = SessionLocal()
        user_create = UserCreate(
            username="test_crud_user",
            password="testpass123",
            full_name="Test CRUD User",
            date_of_birth=date(1990, 1, 1),
            organization="Test Organization"
        )
        created_user = create_user(db, user_create)
        assert created_user.username == "test_crud_user"
        found_user = get_user_by_username(db, "test_crud_user")
        assert found_user is not None
        assert found_user.username == "test_crud_user"
        found_user_by_id = get_user_by_id(db, created_user.id)
        assert found_user_by_id is not None
        assert found_user_by_id.id == created_user.id
        all_users = get_users(db)
        assert len(all_users) > 0
        rowword_create = RowWordCreate(
            ID="test_crud_word_001",
            ID_sen="test_crud_sentence_001",
            Word="testword",
            Lemma="testword",
            Links="1:2",
            Morph="POS=NOUN",
            POS="NOUN",
            Phrase="NP",
            Grm="root",
            NER="O",
            Semantic="test",
            Lang_code="en"
        )
        created_rowword = create_row_word(db, rowword_create)
        assert created_rowword.ID == "test_crud_word_001"
        all_rowwords = get_all_row_words(db)
        assert len(all_rowwords) > 0
        db.delete(created_user)
        db.delete(created_rowword)
        db.commit()
        db.close()

if __name__ == "__main__":
    # Run tests manually
    test_instance = TestDatabase()
    
    print("🧪 Testing Database Operations...")
    print("=" * 50)
    
    try:
        test_instance.test_database_connection()
        print("✅ Database connection test passed")
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
    
    try:
        test_instance.test_user_model()
        print("✅ User model test passed")
    except Exception as e:
        print(f"❌ User model test failed: {e}")
    
    try:
        test_instance.test_rowword_model()
        print("✅ RowWord model test passed")
    except Exception as e:
        print(f"❌ RowWord model test failed: {e}")
    
    try:
        test_instance.test_sentence_model()
        print("✅ Sentence model test passed")
    except Exception as e:
        print(f"❌ Sentence model test failed: {e}")
    
    try:
        test_instance.test_point_model()
        print("✅ Point model test passed")
    except Exception as e:
        print(f"❌ Point model test failed: {e}")
    
    try:
        test_instance.test_crud_operations()
        print("✅ CRUD operations test passed")
    except Exception as e:
        print(f"❌ CRUD operations test failed: {e}")
    
    print("=" * 50)
    print("🎉 Database tests completed!") 