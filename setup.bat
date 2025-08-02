@echo off
echo 🚀 Setting up Parallel Corpus Application...

REM Kiểm tra Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Kiểm tra Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Node.js and Python are installed.

REM Cài đặt Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Cài đặt Python dependencies
echo 🐍 Installing Python dependencies...
pip install -r requirements.txt

REM Tải model spaCy
echo 📚 Downloading spaCy English model...
python -m spacy download en_core_web_sm

REM Tạo thư mục scripts nếu chưa có
if not exist "scripts" mkdir scripts

echo ✅ Setup completed successfully!
echo.
echo 🎯 To run the application:
echo    npm run dev
echo.
echo 🌐 The application will be available at: http://localhost:3000
pause 
 