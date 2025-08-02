# 🚀 Hướng dẫn chạy ứng dụng nhanh

## Bước 1: Kiểm tra yêu cầu hệ thống

```bash
# Kiểm tra Node.js
node --version  # Cần 18.0.0+

# Kiểm tra Python
python3 --version  # Cần 3.8+
```

## Bước 2: Cài đặt tự động (Khuyến nghị)

### macOS/Linux:
```bash
./setup.sh
```

### Windows:
```cmd
setup.bat
```

## Bước 3: Chạy ứng dụng

```bash
npm run dev
```

## Bước 4: Truy cập ứng dụng

Mở trình duyệt và truy cập: **http://localhost:3000**

## 🎯 Test nhanh

1. **Tab "Ngữ liệu song song"**: Xem dữ liệu mẫu
2. **Tab "Phân tích ngôn ngữ"**: 
   - Nhập: "Chúng tôi đã học bài ở trường cả ngày"
   - Chọn loại phân tích
   - Nhấn "Phân tích"

## ❗ Nếu gặp lỗi

### Lỗi Node.js:
```bash
# Cài đặt Node.js từ https://nodejs.org/
```

### Lỗi Python:
```bash
# Cài đặt Python từ https://www.python.org/downloads/
```

### Lỗi port 3000:
```bash
npm run dev -- -p 3001
```

### Lỗi Python dependencies:
```bash
pip3 install -r requirements.txt
python3 -m spacy download en_core_web_sm
```

## 📞 Hỗ trợ

Xem file `RUN_LOCAL.md` để biết hướng dẫn chi tiết. 