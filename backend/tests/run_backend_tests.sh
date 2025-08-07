#!/bin/bash

# 🧪 Parallel Corpus Backend Tests Runner
# Chạy tất cả tests cho backend từ thư mục gốc

echo "🚀 Parallel Corpus Backend Tests"
echo "=================================="

# Kiểm tra xem có đang ở thư mục gốc không
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: docker-compose.yml"
    exit 1
fi

# Kiểm tra xem backend có đang chạy không
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:8000/docs > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start the system first:"
    echo "   docker-compose up -d"
    exit 1
fi

# Chạy tests
echo ""
echo "🧪 Running backend tests..."
cd backend

if [ -f "tests/run_all_tests.py" ]; then
    python tests/run_all_tests.py
    exit_code=$?
else
    echo "❌ Test runner not found: tests/run_all_tests.py"
    exit 1
fi

# Quay lại thư mục gốc
cd ..

echo ""
echo "=================================="
if [ $exit_code -eq 0 ]; then
    echo "🎉 All tests completed successfully!"
else
    echo "⚠️ Some tests failed. Check the output above."
fi

exit $exit_code 