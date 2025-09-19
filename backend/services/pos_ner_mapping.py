"""
Mapping service for POS tags and NER labels to specific Vietnamese/English values
"""

# English POS mapping to specific values
EN_POS_MAPPING = {
    "CC": "Liên từ đẳng lập",
    "CD": "Số từ", 
    "DT": "Từ hạn định",
    "EX": "Từ \"there\" tồn tại",
    "FW": "Từ nước ngoài",
    "IN": "Giới từ hoặc liên từ phụ thuộc",
    "JJ": "Tính từ",
    "JJR": "Tính từ so sánh hơn",
    "JJS": "Tính từ so sánh nhất",
    "LS": "Ký hiệu đánh dấu danh sách",
    "MD": "Động từ khiếm khuyết",
    "NN": "Danh từ số ít hoặc không đếm được",
    "NNS": "Danh từ số nhiều",
    "NNP": "Danh từ riêng số ít",
    "NNPS": "Danh từ riêng số nhiều",
    "PDT": "Từ hạn định trước",
    "POS": "Hậu tố sở hữu",
    "PRP": "Đại từ nhân xưng",
    "PRP$": "Đại từ sở hữu",
    "RB": "Trạng từ",
    "RBR": "Trạng từ so sánh hơn",
    "RBS": "Trạng từ so sánh nhất",
    "RP": "Tiểu từ",
    "SYM": "Ký hiệu",
    "TO": "Từ \"to\"",
    "UH": "Thán từ",
    "VB": "Động từ nguyên mẫu",
    "VBD": "Động từ quá khứ",
    "VBG": "Động từ dạng V-ing",
    "VBN": "Động từ phân từ II",
    "VBP": "Động từ hiện tại (không ngôi thứ 3 số ít)",
    "VBZ": "Động từ hiện tại (ngôi thứ 3 số ít)",
    "WDT": "Từ hạn định nghi vấn",
    "WP": "Đại từ nghi vấn",
    "WP$": "Đại từ nghi vấn sở hữu",
    "WRB": "Trạng từ nghi vấn"
}

# Mapping từ VnCoreNLP tags chung chung sang tags cụ thể
VNCORENLP_TO_SPECIFIC = {
    # Danh từ chung chung -> cụ thể
    "N": "Nn",  # Danh từ chung -> Danh từ khác
    "Np": "Nr", # Danh từ riêng -> Danh từ riêng
    
    # Động từ chung chung -> cụ thể  
    "V": "Vv",  # Động từ chung -> Động từ khác
    
    # Đại từ chung chung -> cụ thể
    "P": "Pp",  # Đại từ chung -> Đại từ khác
    
    # Tính từ chung chung -> cụ thể
    "A": "Aa",  # Tính từ chung -> Tính từ khác
    
    # Dấu câu chung chung -> cụ thể
    "CH": "PU", # Dấu câu chung -> Dấu câu
    
    # Liên từ chung chung -> cụ thể
    "C": "Cp",  # Liên từ chung -> Liên từ đẳng lập
    
    # Giữ nguyên tất cả các tags cụ thể đã có
    "Nr": "Nr", "Nc": "Nc", "Nu": "Nu", "Nt": "Nt", "Nq": "Nq", "Nn": "Nn",
    "Vd": "Vd", "Ve": "Ve", "Vc": "Vc", "Vv": "Vv",
    "An": "An", "Aa": "Aa",
    "Pd": "Pd", "Pp": "Pp",
    "R": "R",
    "D": "D", "Cm": "Cm", "Cp": "Cp", "Cs": "Cs", "E": "E",
    "M": "M", "I": "I", "FW": "FW", "ON": "ON", "PU": "PU",
    "ID": "ID", "X": "X", "L": "L", "T": "T", "Y": "Y", "S": "S"
}

# Vietnamese POS mapping to specific values (sử dụng tags cụ thể)
VN_POS_MAPPING = {
    # Danh từ cụ thể
    "Nr": "Danh từ riêng",
    "Nc": "Danh từ loại (loại từ)",
    "Nu": "Danh từ đơn vị",
    "Nt": "Danh từ thời gian",
    "Nq": "Danh từ số lượng (số từ)",
    "Nn": "Danh từ khác",
    
    # Động từ cụ thể
    "Vd": "Động từ chỉ hướng",
    "Ve": "Động từ tồn tại",
    "Vc": "Động từ liên kết \"là\"",
    "Vv": "Động từ khác",
    
    # Giới từ và liên từ cụ thể
    "D": "Giới từ chỉ hướng",
    "Cm": "Giới từ chính/phụ",
    "Cp": "Liên từ đẳng lập",
    "Cs": "Liên từ phụ thuộc",
    
    # Tính từ cụ thể
    "An": "Số thứ tự",
    "Aa": "Tính từ khác",
    
    # Đại từ cụ thể
    "Pd": "Đại từ chỉ định",
    "Pp": "Đại từ khác",
    
    # Trạng từ
    "R": "Trạng ngữ",
    
    # Từ bổ nghĩa
    "M": "Từ bổ nghĩa",
    
    # Thán từ
    "E": "Thán từ",
    
    # Từ nước ngoài
    "FW": "Từ nước ngoài",
    
    # Từ tượng thanh
    "ON": "Từ tượng thanh",
    
    # Dấu câu
    "PU": "Dấu câu",
    
    # Thành ngữ
    "ID": "Thành ngữ",
    
    # Từ không xác định
    "X": "Từ không xác định"
}

# English NER mapping to specific values
EN_NER_MAPPING = {
    "DATE": "Ngày tháng",
    "LOCATION": "Địa điểm", 
    "MONEY": "Tiền tệ",
    "O": "Khác",
    "ORGANIZATION": "Tổ chức",
    "PERCENT": "Phần trăm",
    "PERSON": "Người",
    "TIME": "Thời gian"
}

# Vietnamese NER mapping to specific values
VN_NER_MAPPING = {
    "ABB": "Từ viết tắt của thực thể không thuộc các lớp bên dưới",
    "ABB_DES": "Từ viết tắt của chức danh",
    "ABB_GPE": "Từ viết tắt của thực thể địa-chính trị",
    "ABB_TRM": "Từ viết tắt của thực thể thuật ngữ",
    "ABB_ORG": "Từ viết tắt của tổ chức, cơ quan, công ty",
    "ABB_LOC": "Từ viết tắt của địa danh",
    "TTL": "Chức danh",
    "DES": "Chỉ định",
    "GPE": "Thực thể địa-chính trị",
    "PER": "Người",
    "ORG": "Tổ chức",
    "LOC": "Địa điểm",
    "DTM": "Ngày giờ",
    "BRN": "Thương hiệu",
    "MEA": "Đơn vị đo lường",
    "MON": "Tiền tệ",
    "PEC": "Phần trăm",
    "NUM": "Số lượng",
    "TRM": "Thuật ngữ"
}

# Mapping from spaCy POS tags to our specific POS tags
SPACY_TO_EN_POS = {
    "ADJ": "JJ", "ADP": "IN", "ADV": "RB", "AUX": "MD", "CONJ": "CC", "DET": "DT",
    "INTJ": "UH", "NOUN": "NN", "NUM": "CD", "PART": "RP", "PRON": "PRP", "PROPN": "NNP",
    "PUNCT": "PU", "SCONJ": "IN", "SYM": "SYM", "VERB": "VB", "X": "FW", "SPACE": "PU"
}

# Mapping from spaCy NER labels to our specific NER labels
SPACY_TO_EN_NER = {
    "PERSON": "PERSON", "ORG": "ORGANIZATION", "GPE": "LOCATION", "LOC": "LOCATION",
    "DATE": "DATE", "TIME": "TIME", "MONEY": "MONEY", "PERCENT": "PERCENT",
    "CARDINAL": "NUM", "ORDINAL": "NUM", "QUANTITY": "NUM", "EVENT": "O",
    "FAC": "LOCATION", "LANGUAGE": "O", "LAW": "O", "NORP": "ORG", "PRODUCT": "O",
    "WORK_OF_ART": "O", "MISC": "O"
}

def map_pos_tag(pos_tag: str, language: str = "en") -> tuple[str, str]:
    """
    Map POS tag to specific value and explanation
    
    Args:
        pos_tag: Original POS tag from spaCy or VnCoreNLP
        language: Language code ("en" or "vi")
    
    Returns:
        Tuple of (specific_pos_tag, explanation)
    """
    if language == "en":
        # First map from spaCy to our EN POS tags
        mapped_pos = SPACY_TO_EN_POS.get(pos_tag, pos_tag)
        explanation = EN_POS_MAPPING.get(mapped_pos, f"Unknown POS tag: {mapped_pos}")
        return mapped_pos, explanation
    elif language == "vi":
        # First map from VnCoreNLP general tags to specific tags
        specific_tag = VNCORENLP_TO_SPECIFIC.get(pos_tag, pos_tag)
        explanation = VN_POS_MAPPING.get(specific_tag, f"Unknown POS tag: {specific_tag}")
        return specific_tag, explanation
    else:
        return pos_tag, f"Unknown language: {language}"

def map_ner_label(ner_label: str, language: str = "en") -> tuple[str, str]:
    """
    Map NER label to specific value and explanation
    
    Args:
        ner_label: Original NER label from spaCy or VnCoreNLP
        language: Language code ("en" or "vi")
    
    Returns:
        Tuple of (specific_ner_label, explanation)
    """
    if language == "en":
        # First map from spaCy to our EN NER labels
        mapped_ner = SPACY_TO_EN_NER.get(ner_label, "O")
        explanation = EN_NER_MAPPING.get(mapped_ner, f"Unknown NER label: {mapped_ner}")
        return mapped_ner, explanation
    elif language == "vi":
        explanation = VN_NER_MAPPING.get(ner_label, f"Unknown NER label: {ner_label}")
        return ner_label, explanation
    else:
        return ner_label, f"Unknown language: {language}"

def get_all_pos_tags(language: str = "en") -> dict[str, str]:
    """
    Get all available POS tags for a language
    
    Args:
        language: Language code ("en" or "vi")
    
    Returns:
        Dictionary of POS tag -> explanation
    """
    if language == "en":
        return EN_POS_MAPPING
    elif language == "vi":
        return VN_POS_MAPPING
    else:
        return {}

def get_all_ner_labels(language: str = "en") -> dict[str, str]:
    """
    Get all available NER labels for a language
    
    Args:
        language: Language code ("en" or "vi")
    
    Returns:
        Dictionary of NER label -> explanation
    """
    if language == "en":
        return EN_NER_MAPPING
    elif language == "vi":
        return VN_NER_MAPPING
    else:
        return {}
