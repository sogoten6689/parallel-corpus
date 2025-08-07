#!/bin/bash

# 🧪 All Tests Runner trong Docker
# Chạy tất cả tests trong backend container

echo "🐳 Running All Tests in Docker Container"
echo "========================================"

# Kiểm tra containers đang chạy
echo "🔍 Checking Docker containers..."
if ! docker-compose ps | grep -q "paracor-backend.*Up"; then
    echo "❌ Backend container is not running. Please start the system first:"
    echo "   docker-compose up -d"
    exit 1
fi

if ! docker-compose ps | grep -q "paracor-db.*Up"; then
    echo "❌ Database container is not running. Please start the system first:"
    echo "   docker-compose up -d"
    exit 1
fi

echo "✅ All containers are running"

# Chạy tất cả tests trong backend container
echo ""
echo "🧪 Running all tests in backend container..."
docker-compose exec backend python tests/run_all_tests.py

# Kiểm tra kết quả
exit_code=$?

echo ""
echo "========================================"
if [ $exit_code -eq 0 ]; then
    echo "🎉 All tests completed successfully!"
else
    echo "⚠️ Some tests failed. Check the output above."
fi

exit $exit_code 