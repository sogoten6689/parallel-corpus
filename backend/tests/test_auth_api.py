#!/usr/bin/env python3
"""
Test Authentication API endpoints
"""
import pytest
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
AUTH_BASE_URL = f"{BASE_URL}/auth"

class TestAuthAPI:
    """Test class for Authentication API endpoints"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code in [200, 404]  # 404 is expected as no root endpoint
    
    def test_signup_new_user(self):
        """Test user registration with new user"""
        user_data = {
            "username": "testuser_new",
            "password": "testpass123",
            "full_name": "Test User New",
            "date_of_birth": "1990-01-01",
            "organization": "Test Organization"
        }
        
        response = requests.post(f"{AUTH_BASE_URL}/sign-up", json=user_data)
        print(f"Signup Response: {response.status_code} - {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert data["username"] == user_data["username"]
            assert data["full_name"] == user_data["full_name"]
            assert data["role"] == "user"
        elif response.status_code == 400:
            # User might already exist
            assert "Username đã tồn tại" in response.text or "Username already exists" in response.text
    
    def test_signup_duplicate_user(self):
        """Test user registration with existing username"""
        user_data = {
            "username": "admin",  # Existing user
            "password": "testpass123",
            "full_name": "Test User",
            "date_of_birth": "1990-01-01",
            "organization": "Test Organization"
        }
        
        response = requests.post(f"{AUTH_BASE_URL}/sign-up", json=user_data)
        assert response.status_code == 400
        assert "Username đã tồn tại" in response.text or "Username already exists" in response.text
    
    def test_login_valid_user(self):
        """Test login with valid credentials"""
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{AUTH_BASE_URL}/login", data=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        return data["access_token"]
    
    def test_login_invalid_user(self):
        """Test login with invalid credentials"""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpass"
        }
        
        response = requests.post(f"{AUTH_BASE_URL}/login", data=login_data)
        assert response.status_code == 401
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # First login to get token
        token = self.test_login_valid_user()
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{AUTH_BASE_URL}/me", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "username" in data
        assert "full_name" in data
        assert "role" in data
    
    def test_get_current_user_no_token(self):
        """Test getting current user without token"""
        response = requests.get(f"{AUTH_BASE_URL}/me")
        assert response.status_code == 401
    
    def test_get_all_users_admin(self):
        """Test getting all users (admin only)"""
        # Login as admin
        token = self.test_login_valid_user()
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{AUTH_BASE_URL}/users", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check if admin user exists in the list
        admin_users = [user for user in data if user["username"] == "admin"]
        assert len(admin_users) > 0
        assert admin_users[0]["role"] == "admin"
    
    def test_get_all_users_no_auth(self):
        """Test getting all users without authentication"""
        response = requests.get(f"{AUTH_BASE_URL}/users")
        assert response.status_code == 401

if __name__ == "__main__":
    # Run tests manually
    test_instance = TestAuthAPI()
    
    print("🧪 Testing Authentication API...")
    print("=" * 50)
    
    try:
        test_instance.test_health_check()
        print("✅ Health check test passed")
    except Exception as e:
        print(f"❌ Health check test failed: {e}")
    
    try:
        test_instance.test_signup_new_user()
        print("✅ Signup test passed")
    except Exception as e:
        print(f"❌ Signup test failed: {e}")
    
    try:
        test_instance.test_login_valid_user()
        print("✅ Login test passed")
    except Exception as e:
        print(f"❌ Login test failed: {e}")
    
    try:
        test_instance.test_get_current_user()
        print("✅ Get current user test passed")
    except Exception as e:
        print(f"❌ Get current user test failed: {e}")
    
    try:
        test_instance.test_get_all_users_admin()
        print("✅ Get all users test passed")
    except Exception as e:
        print(f"❌ Get all users test failed: {e}")
    
    print("=" * 50)
    print("🎉 Authentication API tests completed!") 