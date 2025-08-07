# 🧪 Backend Tests

Thư mục này chứa tất cả các file test cho Parallel Corpus Backend.

## 📁 Cấu trúc thư mục

```
tests/
├── README.md                    # File này
├── requirements-test.txt        # Dependencies cho testing
├── run_all_tests.py            # Script chạy tất cả tests
├── test_auth_api.py            # Test Authentication API
├── test_rowword_api.py         # Test RowWord API
├── test_database.py            # Test Database operations
├── test_integration.py         # Test Integration
├── test_auth.py                # Test cũ (legacy)
└── install_auth_deps.py        # Script cài đặt auth dependencies
```

## 🚀 Cách chạy tests

### 1. Chạy tất cả tests
```bash
cd backend
python tests/run_all_tests.py
```

### 2. Chạy từng test riêng lẻ
```bash
# Test Authentication API
python tests/test_auth_api.py

# Test RowWord API
python tests/test_rowword_api.py

# Test Database
python tests/test_database.py

# Test Integration
python tests/test_integration.py
```

### 3. Chạy với pytest (nếu có cài đặt)
```bash
# Cài đặt pytest
pip install -r tests/requirements-test.txt

# Chạy tests
pytest tests/ -v

# Chạy với coverage
pytest tests/ --cov=. --cov-report=html
```

## 📋 Danh sách tests

### 🔐 Authentication Tests (`test_auth_api.py`)
- ✅ Health check
- ✅ User registration (new user)
- ✅ User registration (duplicate user)
- ✅ User login (valid credentials)
- ✅ User login (invalid credentials)
- ✅ Get current user info
- ✅ Get current user (no token)
- ✅ Get all users (admin)
- ✅ Get all users (no auth)

### 📝 RowWord API Tests (`test_rowword_api.py`)
- ✅ Get words with pagination
- ✅ Get words with language filter
- ✅ Get words with search
- ✅ Create new word
- ✅ Create duplicate word
- ✅ Get sentences
- ✅ Export row words to Excel
- ✅ Import row words from file
- ✅ Import corpus file

### 🗄️ Database Tests (`test_database.py`)
- ✅ Database connection
- ✅ User model creation
- ✅ RowWord model creation
- ✅ Sentence model creation
- ✅ Point model creation
- ✅ CRUD operations

### 🔗 Integration Tests (`test_integration.py`)
- ✅ System health check
- ✅ Full user workflow
- ✅ Data workflow
- ✅ Admin workflow
- ✅ Error handling
- ✅ Performance tests

## ⚙️ Cấu hình

### Environment Variables
Tests sử dụng các biến môi trường sau:
- `BASE_URL`: URL của backend API (mặc định: http://localhost:8000)
- `DATABASE_URL`: URL của database (từ docker-compose)

### Test Data
- **Admin User**: `admin` / `admin123`
- **Test Users**: Tự động tạo trong quá trình test
- **Test Words**: Tự động tạo và cleanup

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Database connection failed**
   ```bash
   # Kiểm tra Docker containers
   docker-compose ps
   
   # Restart database
   docker-compose restart db
   ```

2. **Import errors**
   ```bash
   # Cài đặt dependencies
   pip install -r tests/requirements-test.txt
   ```

3. **Timeout errors**
   - Tăng timeout trong `run_all_tests.py`
   - Kiểm tra performance của hệ thống

### Debug Mode
Để debug tests, thêm `print` statements hoặc sử dụng pytest debugger:
```bash
pytest tests/ -s --pdb
```

## 📊 Coverage Report

Sau khi chạy tests với coverage:
```bash
pytest tests/ --cov=. --cov-report=html
```

Mở file `htmlcov/index.html` để xem báo cáo coverage.

## 🔄 Continuous Integration

Tests có thể được tích hợp vào CI/CD pipeline:
```yaml
# Example GitHub Actions
- name: Run Backend Tests
  run: |
    cd backend
    python tests/run_all_tests.py
```

## 📝 Contributing

Khi thêm test mới:
1. Tạo file test theo naming convention: `test_*.py`
2. Thêm docstring mô tả test
3. Sử dụng assert statements rõ ràng
4. Cleanup test data sau khi test
5. Cập nhật README này

## 🎯 Best Practices

1. **Isolation**: Mỗi test phải độc lập
2. **Cleanup**: Xóa dữ liệu test sau khi hoàn thành
3. **Descriptive**: Tên test phải mô tả rõ chức năng
4. **Fast**: Tests phải chạy nhanh
5. **Reliable**: Tests phải ổn định và có thể lặp lại 