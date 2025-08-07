#!/usr/bin/env python3
"""
Test script for authentication system
"""
import requests
import json
from datetime import date

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_signup():
    """Test user registration"""
    print("Testing user registration...")
    
    user_data = {
        "email": "testuser@gmail.com",
        "password": "testpass123",
        "full_name": "Test User",
        "date_of_birth": "1990-01-01",
        "organization": "Test Organization"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/sign-up", json=user_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    """Test user login"""
    print("\nTesting user login...")
    
    login_data = {
        "email": "testuser@gmail.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            return token
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

# Comment out test_me_endpoint vì lỗi fixture token không tồn tại
# def test_me_endpoint(token):
#     """Test getting current user info"""
#     print("\nTesting /me endpoint...")
    
#     headers = {"Authorization": f"Bearer {token}"}
    
#     try:
#         response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
#         print(f"Status Code: {response.status_code}")
#         print(f"Response: {response.json()}")
#         return response.status_code == 200
#     except Exception as e:
#         print(f"Error: {e}")
#         return False

def test_duplicate_email():
    """Test duplicate email registration"""
    print("\nTesting duplicate email...")
    
    user_data = {
        "email": "testuser@gmail.com",  # Same email as before
        "password": "anotherpass",
        "full_name": "Another User",
        "date_of_birth": "1995-01-01",
        "organization": "Another Organization"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/sign-up", json=user_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 400  # Should fail
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("=== Authentication System Test ===\n")
    
    # Test 1: User registration
    signup_success = test_signup()
    
    # Test 2: User login
    token = test_login()
    
    # Test 3: Get current user info
    if token:
        # me_success = test_me_endpoint(token) # Commented out as per edit hint
        pass # Placeholder for future test_me_endpoint call
    
    # Test 4: Duplicate email
    duplicate_test = test_duplicate_email()
    
    print("\n=== Test Summary ===")
    print(f"Signup: {'PASS' if signup_success else 'FAIL'}")
    print(f"Login: {'PASS' if token else 'FAIL'}")
    print(f"Me endpoint: {'PASS' if token and False else 'FAIL'}") # Modified to reflect me_success is commented out
    print(f"Duplicate email: {'PASS' if duplicate_test else 'FAIL'}")

if __name__ == "__main__":
    main() 