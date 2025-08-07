# Authentication System Documentation

## Overview
This document describes the authentication system implemented for the Parallel Corpus API, including user registration, login, and role-based access control.

## Features

### 1. User Registration (`POST /auth/sign-up`)
- **Endpoint**: `POST /auth/sign-up`
- **Description**: Đăng ký tài khoản mới / Register new account
- **Request Body**:
```json
{
  "email": "string",
  "password": "string", 
  "full_name": "string",
  "date_of_birth": "YYYY-MM-DD",
  "organization": "string"
}
```
- **Response**: User information (without password)
- **Validation**:
  - Checks for duplicate email
  - Validates required fields
  - Hashes password using bcrypt

### 2. User Login (`POST /auth/login`)
- **Endpoint**: `POST /auth/login`
- **Description**: Đăng nhập / Login
- **Request Body** (form data):
```
email: string
password: string
```
- **Response**:
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### 3. Get Current User (`GET /auth/me`)
- **Endpoint**: `GET /auth/me`
- **Description**: Lấy thông tin user hiện tại / Get current user information
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current user information

### 4. List Users (`GET /auth/users`)
- **Endpoint**: `GET /auth/users`
- **Description**: Lấy danh sách users (chỉ admin) / Get list of users (admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Access**: Admin only
- **Query Parameters**:
  - `skip`: Number of records to skip (default: 0)
  - `limit`: Maximum number of records to return (default: 100)

## User Roles

### Admin Role
- Can access all endpoints
- Can view list of all users
- Full system access

### User Role
- Can register and login
- Can view own profile
- Limited access to system features

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    date_of_birth DATE NOT NULL,
    organization VARCHAR NOT NULL,
    role userrole NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### UserRole Enum
```sql
CREATE TYPE userrole AS ENUM ('admin', 'user');
```

## Pre-configured Users

The system automatically creates 4 initial users on startup:

1. **lananh** (User)
   - email: `lananh@gmail.com`
   - Password: `lananh123`
   - Full Name: Nguyễn Thị Lan Anh
   - Organization: HCMUS

2. **lam** (User)
   - email: `sogoten6689@gmail.com`
   - Password: `LAm@123456`
   - Full Name: Nguyễn Ngọc Lâm
   - Organization: HCMUS

3. **thang** (User)
   - email: `thang@gmail.com`
   - Password: `thang123`
   - Full Name: La Quốc Thắng
   - Organization: HCMUS

4. **admin** (Admin)
   - email: `admin@gmail.com`
   - Password: `admin123`
   - Full Name: Administrator
   - Organization: HCMUS

## Security Features

### Password Hashing
- Uses bcrypt for password hashing
- Salt is automatically generated
- Secure against rainbow table attacks

### JWT Tokens
- Access tokens expire after 30 minutes
- Uses HS256 algorithm
- Tokens contain user information (email)

### Input Validation
- All inputs are validated using Pydantic schemas
- SQL injection protection through SQLAlchemy ORM
- XSS protection through proper input sanitization

## API Usage Examples

### Register a new user
```bash
curl -X POST "http://localhost:8000/auth/sign-up" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuse@gmail.com",
    "password": "password123",
    "full_name": "New User",
    "date_of_birth": "1990-01-01",
    "organization": "Test Org"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=newuser@gmail.com&password=password123"
```

### Get current user info
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer <your_token>"
```

### List all users (admin only)
```bash
curl -X GET "http://localhost:8000/auth/users" \
  -H "Authorization: Bearer <admin_token>"
```

## Error Handling

### Common Error Responses

**400 Bad Request** - Invalid input data
```json
{
  "detail": "email đã tồn tại / email already exists"
}
```

**401 Unauthorized** - Invalid credentials
```json
{
  "detail": "Tên email hoặc mật khẩu không đúng / Incorrect email or password"
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "detail": "Không có quyền truy cập / Access denied"
}
```

## Testing

Run the test script to verify the authentication system:
```bash
cd backend
python test_auth.py
```

## Dependencies

The following additional dependencies were added:
- `passlib[bcrypt]` - Password hashing
- `python-jose[cryptography]` - JWT token handling
- `python-multipart` - Form data parsing

## Migration

To apply the database migration:
```bash
cd backend
alembic upgrade head
```

## Environment Variables

Make sure to set a secure `SECRET_KEY` in production:
```python
# In auth.py, change this line:
SECRET_KEY = "your-secret-key-here-change-in-production"
```

For production, use a strong, randomly generated secret key and store it in environment variables. 