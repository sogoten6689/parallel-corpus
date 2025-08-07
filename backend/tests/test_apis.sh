#!/bin/bash

# Script test nhanh các API của Parallel Corpus System
# Base URL
BASE_URL="http://localhost:8000"

echo "🚀 Bắt đầu test các API của Parallel Corpus System"
echo "=================================================="

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s -X GET "$BASE_URL/" | jq '.' 2>/dev/null || echo "Health check response"

# Test 2: Đăng ký user mới
echo -e "\n2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser"@gmail.com,
    "password": "testpass123",
    "full_name": "Test User",
    "date_of_birth": "1990-01-01",
    "organization": "Test Organization"
  }')
echo $REGISTER_RESPONSE | jq '.' 2>/dev/null || echo $REGISTER_RESPONSE

# Test 3: Đăng nhập
echo -e "\n3. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@gmail.com&password=admin123")
echo $LOGIN_RESPONSE | jq '.' 2>/dev/null || echo $LOGIN_RESPONSE

# Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "\n✅ Access token received: ${ACCESS_TOKEN:0:20}..."
    
    # Test 4: Lấy thông tin user hiện tại
    echo -e "\n4. Testing Get Current User..."
    curl -s -X GET "$BASE_URL/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' 2>/dev/null || echo "Get user response"
    
    # Test 5: Lấy danh sách users (admin only)
    echo -e "\n5. Testing Get All Users (Admin only)..."
    curl -s -X GET "$BASE_URL/auth/users" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' 2>/dev/null || echo "Get users response"
    
    # Test 6: Tạo Row Word
    echo -e "\n6. Testing Create Row Word..."
    curl -s -X POST "$BASE_URL/words/" \
      -H "Content-Type: application/json" \
      -d '{
        "ID": "word_001",
        "ID_sen": "sentence_001",
        "Word": "hello",
        "Lemma": "hello",
        "Links": "1:2",
        "Morph": "POS=INTJ",
        "POS": "INTJ",
        "Phrase": "NP",
        "Grm": "root",
        "NER": "O",
        "Semantic": "greeting",
        "Lang_code": "en"
      }' | jq '.' 2>/dev/null || echo "Create row word response"
    
    # Test 7: Lấy tất cả Row Words
    echo -e "\n7. Testing Get All Row Words..."
    curl -s -X GET "$BASE_URL/words/?page=1&limit=10" | jq '.' 2>/dev/null || echo "Get row words response"
    
    # Test 8: Lấy tất cả Sentences
    echo -e "\n8. Testing Get All Sentences..."
    curl -s -X GET "$BASE_URL/sentences" | jq '.' 2>/dev/null || echo "Get sentences response"
    
    # Test 9: Export Row Words to Excel
    echo -e "\n9. Testing Export Row Words to Excel..."
    curl -s -X GET "$BASE_URL/export-rowwords-excel/" | jq '.' 2>/dev/null || echo "Export response"
    
else
    echo -e "\n❌ Failed to get access token"
fi

echo -e "\n=================================================="
echo "✅ Test hoàn thành!"
echo ""
echo "📋 Tóm tắt các API đã test:"
echo "1. Health Check"
echo "2. User Registration"
echo "3. User Login"
echo "4. Get Current User"
echo "5. Get All Users (Admin)"
echo "6. Create Row Word"
echo "7. Get All Row Words (with pagination)"
echo "8. Get All Sentences"
echo "9. Export Row Words to Excel"
echo ""
echo "🌐 API Documentation: $BASE_URL/docs"
echo "🔗 Frontend: http://localhost:3000" 