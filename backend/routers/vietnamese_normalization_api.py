from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import unicodedata
import re

router = APIRouter()

class TextRequest(BaseModel):
    text: str

def normalize_vietnamese_syllable(word):
    """
    Hàm chuẩn hóa âm tiết tiếng Việt cho mục đích gõ chữ.
    Quy tắc: sắc=1, huyền=2, hỏi=3, ngã=4, nặng=5
    """
    if not word:
        return ""
    
    # Nếu không phải là từ tiếng Việt (chỉ có ký tự đặc biệt), trả về dấu gạch ngang
    if not re.search(r'[a-zA-ZÀ-ỹ]', word):
        return "-"
    
    # Bước 1: Chuẩn hóa Unicode và chuyển về chữ thường
    normalized = unicodedata.normalize('NFC', word.lower())
    
    # Mapping các ký tự có dấu thanh theo quy tắc mới
    # sắc=1, huyền=2, hỏi=3, ngã=4, nặng=5
    tone_mapping = {
        'á': ('a', '1'), 'à': ('a', '2'), 'ả': ('a', '3'), 'ã': ('a', '4'), 'ạ': ('a', '5'),
        'ắ': ('aw', '1'), 'ằ': ('aw', '2'), 'ẳ': ('aw', '3'), 'ẵ': ('aw', '4'), 'ặ': ('aw', '5'),
        'ấ': ('aa', '1'), 'ầ': ('aa', '2'), 'ẩ': ('aa', '3'), 'ẫ': ('aa', '4'), 'ậ': ('aa', '5'),
        'é': ('e', '1'), 'è': ('e', '2'), 'ẻ': ('e', '3'), 'ẽ': ('e', '4'), 'ẹ': ('e', '5'),
        'ế': ('ee', '1'), 'ề': ('ee', '2'), 'ể': ('ee', '3'), 'ễ': ('ee', '4'), 'ệ': ('ee', '5'),
        'í': ('i', '1'), 'ì': ('i', '2'), 'ỉ': ('i', '3'), 'ĩ': ('i', '4'), 'ị': ('i', '5'),
        'ó': ('o', '1'), 'ò': ('o', '2'), 'ỏ': ('o', '3'), 'õ': ('o', '4'), 'ọ': ('o', '5'),
        'ố': ('oo', '1'), 'ồ': ('oo', '2'), 'ổ': ('oo', '3'), 'ỗ': ('oo', '4'), 'ộ': ('oo', '5'),
        'ớ': ('ow', '1'), 'ờ': ('ow', '2'), 'ở': ('ow', '3'), 'ỡ': ('ow', '4'), 'ợ': ('ow', '5'),
        'ú': ('u', '1'), 'ù': ('u', '2'), 'ủ': ('u', '3'), 'ũ': ('u', '4'), 'ụ': ('u', '5'),
        'ứ': ('uw', '1'), 'ừ': ('uw', '2'), 'ử': ('uw', '3'), 'ữ': ('uw', '4'), 'ự': ('uw', '5'),
        'ý': ('y', '1'), 'ỳ': ('y', '2'), 'ỷ': ('y', '3'), 'ỹ': ('y', '4'), 'ỵ': ('y', '5'),
        'đ': ('dd', '')
    }
    
    # Bước 2: Xử lý tất cả các ký tự có dấu trong từ
    base_word = normalized
    tone_numbers = []
    
    # Tìm tất cả các ký tự có dấu thanh và xử lý chúng
    for char in normalized:
        if char in tone_mapping:
            base_char, tone = tone_mapping[char]
            base_word = base_word.replace(char, base_char)
            if tone:  # Chỉ thêm tone nếu không rỗng
                tone_numbers.append(tone)
    
    # Nếu có dấu thanh, sử dụng dấu thanh cuối cùng
    tone_number = tone_numbers[-1] if tone_numbers else ''
    
    # Bước 3: Xử lý các nguyên âm đặc biệt
    vowel_mapping = {
        'ă': 'aw', 'â': 'aa', 'ư': 'uw', 'ơ': 'ow', 'ê': 'ee', 'ô': 'oo'
    }
    
    # Thay thế nguyên âm đặc biệt
    for vowel, replacement in vowel_mapping.items():
        base_word = base_word.replace(vowel, replacement)
    
    # Bước 4: Xử lý các trường hợp đặc biệt
    special_cases = {
        'gì': 'gi2', 'quà': 'qua2', 'quá': 'qua1', 'quả': 'qua3',
        'quã': 'qua4', 'quạ': 'qua5', 'qua': 'qua',
        'già': 'gia2', 'giá': 'gia1', 'giả': 'gia3', 'giã': 'gia4', 'giạ': 'gia5',
    }
    
    # Kiểm tra từ đặc biệt
    if word.lower() in special_cases:
        return special_cases[word.lower()]
    
    return base_word + tone_number

def normalize_vietnamese_text(text):
    """
    Chuẩn hóa toàn bộ văn bản tiếng Việt cho mục đích gõ chữ.
    Giữ nguyên dấu gạch nối trong từ ghép.
    """
    # Tách từ bằng khoảng trắng, giữ nguyên dấu gạch nối
    words = text.split()
    normalized_words = []
    
    for word in words:
        if '_' in word:
            # Xử lý từ ghép có dấu gạch nối
            parts = word.split('_')
            normalized_parts = []
            for part in parts:
                if not re.search(r'[a-zA-ZÀ-ỹ]', part):
                    normalized_parts.append("-")
                else:
                    normalized_parts.append(normalize_vietnamese_syllable(part))
            normalized_words.append('_'.join(normalized_parts))
        else:
            if not re.search(r'[a-zA-ZÀ-ỹ]', word):
                normalized_words.append("-")
            else:
                normalized_words.append(normalize_vietnamese_syllable(word))
    
    return ' '.join(normalized_words)

@router.post("/normalize")
async def normalize_vietnamese(request: TextRequest):
    """
    Chuẩn hóa văn bản tiếng Việt thành dạng âm tiết tách dấu thanh.
    """
    try:
        normalized_text = normalize_vietnamese_text(request.text)
        return {
            "original_text": request.text,
            "normalized_text": normalized_text,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Normalization failed: {str(e)}")

@router.post("/normalize-syllable")
async def normalize_vietnamese_syllable_endpoint(request: TextRequest):
    """
    Chuẩn hóa một âm tiết tiếng Việt.
    """
    try:
        normalized_syllable = normalize_vietnamese_syllable(request.text)
        return {
            "original_syllable": request.text,
            "normalized_syllable": normalized_syllable,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Syllable normalization failed: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Health check endpoint for Vietnamese normalization service.
    """
    return {"status": "healthy", "service": "vietnamese-normalization"}
