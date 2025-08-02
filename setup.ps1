# PowerShell script để setup Parallel Corpus Application trên Windows

Write-Host "🚀 Setting up Parallel Corpus Application..." -ForegroundColor Green

# Kiểm tra Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra Python
try {
    $pythonVersion = python --version
    Write-Host "✅ Python version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed. Please install Python 3.8+ first." -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Cài đặt Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Cài đặt Python dependencies
Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Tải model spaCy
Write-Host "📚 Downloading spaCy English model..." -ForegroundColor Yellow
python -m spacy download en_core_web_sm

# Tạo thư mục scripts nếu chưa có
if (!(Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts"
}

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 To run the application:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 The application will be available at: http://localhost:3000" -ForegroundColor Cyan 