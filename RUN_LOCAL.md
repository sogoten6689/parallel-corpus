# Hướng dẫn chạy ứng dụng Parallel Corpus trên Local

## Yêu cầu hệ thống

### 1. Node.js
- **Phiên bản**: 18.0.0 trở lên
- **Kiểm tra**: `node --version`
- **Tải về**: https://nodejs.org/

### 2. Python
- **Phiên bản**: 3.8 trở lên
- **Kiểm tra**: `python3 --version`
- **Tải về**: https://www.python.org/downloads/

### 3. npm hoặc yarn
- **npm**: Đi kèm với Node.js
- **yarn**: `npm install -g yarn`

## Cách 1: Sử dụng script tự động (Khuyến nghị)

### Bước 1: Cấp quyền thực thi cho script
```bash
chmod +x setup.sh
```

### Bước 2: Chạy script setup
```bash
./setup.sh
```

### Bước 3: Chạy ứng dụng
```bash
npm run dev
```

## Cách 2: Cài đặt thủ công

### Bước 1: Cài đặt Node.js dependencies
```bash
npm install
```

### Bước 2: Cài đặt Python dependencies
```bash
pip3 install -r requirements.txt
```

### Bước 3: Tải model spaCy
```bash
python3 -m spacy download en_core_web_sm
```

### Bước 4: Chạy ứng dụng
```bash
npm run dev
```

## Kiểm tra ứng dụng

### 1. Truy cập ứng dụng
- Mở trình duyệt web
- Truy cập: http://localhost:3000

### 2. Kiểm tra các chức năng
- **Tab "Ngữ liệu song song"**: Xem dữ liệu mẫu
- **Tab "Phân tích ngôn ngữ"**: Thử phân tích văn bản

### 3. Test phân tích ngôn ngữ
- Nhập câu tiếng Việt: "Chúng tôi đã học bài ở trường cả ngày"
- Chọn loại phân tích
- Nhấn "Phân tích"

## Xử lý lỗi thường gặp

### Lỗi 1: Node.js không tìm thấy
```bash
# Cài đặt Node.js từ https://nodejs.org/
# Hoặc sử dụng nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Lỗi 2: Python không tìm thấy
```bash
# macOS
brew install python3

# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# Windows
# Tải từ https://www.python.org/downloads/
```

### Lỗi 3: Port 3000 đã được sử dụng
```bash
# Tìm process sử dụng port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Hoặc chạy trên port khác
npm run dev -- -p 3001
```

### Lỗi 4: Python dependencies lỗi
```bash
# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# hoặc
venv\Scripts\activate     # Windows

# Cài đặt lại dependencies
pip install -r requirements.txt
```

### Lỗi 5: spaCy model lỗi
```bash
# Xóa và tải lại model
python3 -m spacy uninstall en_core_web_sm
python3 -m spacy download en_core_web_sm
```

## Cấu trúc thư mục sau khi setup

```
parallel-corpus/
├── node_modules/          # Node.js dependencies
├── src/                   # Source code
├── scripts/               # Python scripts
├── public/                # Static files
├── package.json           # Node.js config
├── requirements.txt       # Python dependencies
├── setup.sh              # Setup script
└── RUN_LOCAL.md          # This file
```

## Lệnh hữu ích

### Development
```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run start        # Chạy production server
npm run lint         # Kiểm tra code style
```

### Python
```bash
python3 scripts/analyze_text.py "Văn bản cần phân tích"  # Test Python script
```

## Troubleshooting

### Nếu gặp lỗi về quyền truy cập
```bash
# macOS/Linux
sudo chmod +x setup.sh
sudo chmod +x scripts/analyze_text.py
```

### Nếu gặp lỗi về memory
```bash
# Tăng memory cho Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### Nếu gặp lỗi về network
```bash
# Kiểm tra firewall
# Đảm bảo port 3000 được mở
```

## Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Console của trình duyệt (F12)
2. Terminal output
3. Logs của Next.js server
4. Python script output

## Liên hệ

Nếu cần hỗ trợ thêm, vui lòng tạo issue trên repository hoặc liên hệ team phát triển. 