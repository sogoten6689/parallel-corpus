#!/bin/bash

# 🧪 Database Tests Runner trong Docker
# Chạy test_database.py trong backend container

echo "🐳 Running Database Tests in Docker Container"
echo "=============================================="

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

# Chạy test trong backend container
echo ""
echo "🧪 Running database tests in backend container..."
docker-compose exec backend python tests/test_database.py

# Kiểm tra kết quả
exit_code=$?

echo ""
echo "=============================================="
if [ $exit_code -eq 0 ]; then
    echo "🎉 Database tests completed successfully!"
else
    echo "⚠️ Some database tests failed. Check the output above."
fi

exit $exit_code 