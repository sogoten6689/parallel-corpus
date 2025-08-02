#!/bin/bash

echo "🚀 Setting up Parallel Corpus Application..."

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ Python version: $(python3 --version)"

# Cài đặt Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Cài đặt Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -r requirements.txt

# Tải model spaCy
echo "📚 Downloading spaCy English model..."
python3 -m spacy download en_core_web_sm

# Tạo thư mục scripts nếu chưa có
mkdir -p scripts

# Cấp quyền thực thi cho script Python
chmod +x scripts/analyze_text.py

echo "✅ Setup completed successfully!"
echo ""
echo "🎯 To run the application:"
echo "   npm run dev"
echo ""
echo "🌐 The application will be available at: http://localhost:3000" 