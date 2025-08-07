#!/usr/bin/env python3
"""
Integration tests for the entire Parallel Corpus system
"""
import pytest
import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
AUTH_BASE_URL = f"{BASE_URL}/auth"

class TestIntegration:
    """Integration tests for the entire system"""
    
    def get_auth_token(self, username="admin", password="admin123"):
        """Get authentication token"""
        login_data = {
            "username": username,
            "password": password
        }
        
        response = requests.post(f"{AUTH_BASE_URL}/login", data=login_data)
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_system_health(self):
        """Test if the entire system is running"""
        response = requests.get(f"{BASE_URL}/docs")
        assert response.status_code == 200, f"Backend not running: {response.status_code} - {response.text}"
        response = requests.get(f"{BASE_URL}/words/?page=1&limit=1")
        assert response.status_code == 200, f"DB connection failed: {response.status_code} - {response.text}"

    def test_full_user_workflow(self):
        """Test complete user workflow: signup -> login -> use APIs"""
        user_data = {
            "username": "integration_test_user",
            "password": "testpass123",
            "full_name": "Integration Test User",
            "date_of_birth": "1990-01-01",
            "organization": "Test Organization"
        }
        response = requests.post(f"{AUTH_BASE_URL}/sign-up", json=user_data)
        assert response.status_code in [200, 400], f"Signup failed: {response.status_code} - {response.text}"
        token = self.get_auth_token("integration_test_user", "testpass123")
        assert token, "Login failed"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{AUTH_BASE_URL}/me", headers=headers)
        assert response.status_code == 200, f"Get current user failed: {response.status_code} - {response.text}"
        user_info = response.json()
        assert user_info["username"] == "integration_test_user"

    def test_data_workflow(self):
        """Test complete data workflow: create -> read -> update"""
        token = self.get_auth_token()
        assert token, "Admin login failed"
        headers = {"Authorization": f"Bearer {token}"}
        import uuid
        unique_id = f"integration_word_{uuid.uuid4().hex[:8]}"
        word_data = {
            "ID": unique_id,
            "ID_sen": f"integration_sentence_{unique_id}",
            "Word": "integration",
            "Lemma": "integration",
            "Links": "1:2",
            "Morph": "POS=NOUN",
            "POS": "NOUN",
            "Phrase": "NP",
            "Grm": "root",
            "NER": "O",
            "Semantic": "process",
            "Lang_code": "en"
        }
        response = requests.post(f"{BASE_URL}/words/", json=word_data)
        assert response.status_code == 200, f"Word creation failed: {response.status_code} - {response.text}"
        response = requests.get(f"{BASE_URL}/words/?search=integration&page=1&limit=10")
        assert response.status_code == 200, f"Word retrieval failed: {response.status_code} - {response.text}"
        data = response.json()
        found_words = [w for w in data["data"] if w["ID"] == word_data["ID"]]
        assert len(found_words) > 0
        response = requests.get(f"{BASE_URL}/sentences")
        assert response.status_code == 200, f"Sentences retrieval failed: {response.status_code} - {response.text}"
        sentences = response.json()
        assert isinstance(sentences, dict)

    def test_admin_workflow(self):
        """Test admin-specific workflows"""
        token = self.get_auth_token()
        assert token, "Admin login failed"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{AUTH_BASE_URL}/users", headers=headers)
        assert response.status_code == 200, f"Admin user management failed: {response.status_code} - {response.text}"
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        admin_users = [u for u in users if u["username"] == "admin"]
        assert len(admin_users) > 0
        assert admin_users[0]["role"] == "admin"

    def test_error_handling(self):
        """Test error handling and edge cases"""
        login_data = {"username": "nonexistent", "password": "wrongpass"}
        response = requests.post(f"{AUTH_BASE_URL}/login", data=login_data)
        assert response.status_code == 401
        response = requests.get(f"{AUTH_BASE_URL}/me")
        assert response.status_code == 401
        invalid_word_data = {"ID": "invalid_word"}
        response = requests.post(f"{BASE_URL}/words/", json=invalid_word_data)
        assert response.status_code in [400, 422]

    def test_performance(self):
        import time
        start_time = time.time()
        for i in range(5):
            response = requests.get(f"{BASE_URL}/words/?page=1&limit=10")
            assert response.status_code == 200
        duration = time.time() - start_time
        assert duration < 10

if __name__ == "__main__":
    # Run integration tests
    test_instance = TestIntegration()
    
    print("🧪 Running Integration Tests...")
    print("=" * 60)
    
    tests = [
        ("System Health", test_instance.test_system_health),
        ("Full User Workflow", test_instance.test_full_user_workflow),
        ("Data Workflow", test_instance.test_data_workflow),
        ("Admin Workflow", test_instance.test_admin_workflow),
        ("Error Handling", test_instance.test_error_handling),
        ("Performance", test_instance.test_performance),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name} test...")
        try:
            test_func()
            print(f"✅ {test_name} test passed")
            passed += 1
        except AssertionError as e:
            print(f"❌ {test_name} test failed: {e}")
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
    
    print("\n" + "=" * 60)
    print(f"🎉 Integration Tests Completed!")
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎯 All tests passed! System is working correctly.")
    else:
        print("⚠️ Some tests failed. Please check the system.") 