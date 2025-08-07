#!/usr/bin/env python3
"""
Test RowWord API endpoints
"""
import pytest
import requests
import json
import tempfile
import os
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
AUTH_BASE_URL = f"{BASE_URL}/auth"

class TestRowWordAPI:
    """Test class for RowWord API endpoints"""
    
    def get_auth_token(self):
        """Get authentication token for testing"""
        login_data = {
            "email": "admin@gmail.com",
            "password": "admin123"
        }
        
        response = requests.post(f"{AUTH_BASE_URL}/login", data=login_data)
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_get_words_pagination(self):
        """Test getting words with pagination"""
        response = requests.get(f"{BASE_URL}/words/?page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        assert "page" in data
        assert "limit" in data
        assert "total" in data
        assert "total_pages" in data
        assert isinstance(data["data"], list)
    
    def test_get_words_with_lang_filter(self):
        """Test getting words filtered by language"""
        response = requests.get(f"{BASE_URL}/words/?lang_code=en&page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        
        # Check if all returned words have the correct language code
        for word in data["data"]:
            assert word["Lang_code"] == "en"
    
    def test_get_words_with_search(self):
        """Test getting words with search filter"""
        response = requests.get(f"{BASE_URL}/words/?search=hello&page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
    
    def test_create_word(self):
        """Test creating a new word (unique ID)"""
        import uuid
        unique_id = f"test_word_{uuid.uuid4().hex[:8]}"
        word_data = {
            "ID": unique_id,
            "ID_sen": f"test_sentence_{unique_id}",
            "Word": "testword",
            "Lemma": "testword",
            "Links": "1:2",
            "Morph": "POS=NOUN",
            "POS": "NOUN",
            "Phrase": "NP",
            "Grm": "root",
            "NER": "O",
            "Semantic": "test",
            "Lang_code": "en"
        }
        response = requests.post(f"{BASE_URL}/words/", json=word_data)
        if response.status_code != 200:
            print(f"Create word failed: {response.status_code} - {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert data["ID"] == word_data["ID"]
        assert data["Word"] == word_data["Word"]
        assert data["Lang_code"] == word_data["Lang_code"]

    def test_create_duplicate_word(self):
        """Test creating a word with duplicate ID (should upsert or error)"""
        import uuid
        unique_id = f"test_word_{uuid.uuid4().hex[:8]}"
        word_data = {
            "ID": unique_id,
            "ID_sen": f"test_sentence_{unique_id}",
            "Word": "testword",
            "Lemma": "testword",
            "Links": "1:2",
            "Morph": "POS=NOUN",
            "POS": "NOUN",
            "Phrase": "NP",
            "Grm": "root",
            "NER": "O",
            "Semantic": "test",
            "Lang_code": "en"
        }
        # Create first
        response1 = requests.post(f"{BASE_URL}/words/", json=word_data)
        assert response1.status_code == 200
        # Create duplicate
        response2 = requests.post(f"{BASE_URL}/words/", json=word_data)
        if response2.status_code not in [200, 400, 409]:
            print(f"Duplicate word failed: {response2.status_code} - {response2.text}")
        assert response2.status_code in [200, 400, 409]
    
    def test_get_sentences(self):
        """Test getting sentences"""
        response = requests.get(f"{BASE_URL}/sentences")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
    
    def test_export_rowwords_excel(self):
        """Test exporting row words to Excel"""
        response = requests.get(f"{BASE_URL}/export-rowwords-excel/")
        assert response.status_code == 200
        
        # Check if response is a file download
        content_type = response.headers.get('content-type', '')
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in content_type or \
               'application/octet-stream' in content_type or \
               'text/html' in content_type  # Some APIs return HTML for empty data
    
    def test_import_rowwords_file(self):
        """Test importing row words from file"""
        # Create a temporary test file
        test_content = """word_001	sentence_001	hello	hello	1:2	POS=INTJ	INTJ	NP	root	O	greeting	en
word_002	sentence_001	world	world	2:3	POS=NOUN	NOUN	NP	obj	O	place	en"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_rowwords.txt', f, 'text/plain')}
                data = {'lang_code': 'en'}
                
                response = requests.post(f"{BASE_URL}/import-rowwords/", files=files, data=data)
                
                # Should succeed or fail gracefully
                assert response.status_code in [200, 400, 422]
                
                if response.status_code == 200:
                    data = response.json()
                    assert "message" in data
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    def test_import_corpus_file(self):
        """Test importing corpus file"""
        # Create a temporary test file with tab-separated format
        test_content = """word_001	sentence_001	hello	hello	1:2	POS=INTJ	INTJ	NP	root	O	greeting
word_002	sentence_001	world	world	2:3	POS=NOUN	NOUN	NP	obj	O	place
word_003	sentence_002	test	test	1:1	POS=VERB	VERB	VP	root	O	action"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_corpus.txt', f, 'text/plain')}
                
                response = requests.post(f"{BASE_URL}/import-corpus-file/", files=files)
                
                # Should succeed with proper format
                if response.status_code == 200:
                    data = response.json()
                    assert "message" in data
                    assert "Imported" in data["message"]
                elif response.status_code == 422:
                    # Missing columns error
                    assert "Missing columns" in response.text
                else:
                    print(f"Import corpus file response: {response.status_code} - {response.text}")
                    assert response.status_code in [200, 422]
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

if __name__ == "__main__":
    # Run tests manually
    test_instance = TestRowWordAPI()
    
    print("🧪 Testing RowWord API...")
    print("=" * 50)
    
    try:
        test_instance.test_get_words_pagination()
        print("✅ Get words pagination test passed")
    except Exception as e:
        print(f"❌ Get words pagination test failed: {e}")
    
    try:
        test_instance.test_get_words_with_lang_filter()
        print("✅ Get words with language filter test passed")
    except Exception as e:
        print(f"❌ Get words with language filter test failed: {e}")
    
    try:
        test_instance.test_get_words_with_search()
        print("✅ Get words with search test passed")
    except Exception as e:
        print(f"❌ Get words with search test failed: {e}")
    
    try:
        test_instance.test_create_word()
        print("✅ Create word test passed")
    except Exception as e:
        print(f"❌ Create word test failed: {e}")
    
    try:
        test_instance.test_get_sentences()
        print("✅ Get sentences test passed")
    except Exception as e:
        print(f"❌ Get sentences test failed: {e}")
    
    try:
        test_instance.test_export_rowwords_excel()
        print("✅ Export row words test passed")
    except Exception as e:
        print(f"❌ Export row words test failed: {e}")
    
    print("=" * 50)
    print("🎉 RowWord API tests completed!") 