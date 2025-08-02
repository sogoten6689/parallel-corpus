# Backend Models Documentation - Parallel Corpus Project

Tài liệu này mô tả tất cả các mô hình AI/ML được sử dụng trong backend của dự án Parallel Corpus Analysis.

## 📋 Tổng quan

Dự án sử dụng tổng cộng **12+ models** khác nhau cho các tác vụ xử lý ngôn ngữ tự nhiên (NLP), từ dịch máy, phân tích cú pháp, đến căn chỉnh từ và phân tích ngữ nghĩa.

## 🔧 Các Model chính

### 1. 🇻🇳 Xử lý Tiếng Việt

#### **underthesea** - Vietnamese NLP Toolkit
- **Mục đích**: Phân tích tiếng Việt toàn diện
- **Chức năng**:
  - Word Tokenization (`word_tokenize`)
  - POS Tagging (`pos_tag`)
  - Named Entity Recognition (`ner`)
  - Dependency Parsing (`dependency_parse`)
  - Chunking (`chunk`)
- **Nguồn**: [Underthesea GitHub](https://github.com/undertheseanlp/underthesea)
- **Bài báo**: 
  - "Underthesea: An Open Source Toolkit for Vietnamese Natural Language Processing"
  - Vu Anh et al., 2018
- **Model Files**: Pre-trained models được tải tự động
- **Ứng dụng**: Phân tích cú pháp và ngữ nghĩa cho văn bản tiếng Việt

---

### 2. 🇬🇧 Xử lý Tiếng Anh

#### **spaCy en_core_web_sm** - English Language Model
- **Tên Model**: `en_core_web_sm`
- **Mục đích**: Phân tích tiếng Anh chuyên sâu
- **Chức năng**:
  - Tokenization
  - POS Tagging
  - Lemmatization
  - Named Entity Recognition
  - Dependency Parsing
  - Sentence Segmentation
- **Nguồn**: [spaCy Models](https://spacy.io/models/en)
- **Kích thước**: ~50MB
- **Độ chính xác**: 97.2% POS accuracy, 85.8% NER F-score
- **Cài đặt**: `python -m spacy download en_core_web_sm`

---

### 3. 🔄 Dịch máy (Machine Translation)

#### **Helsinki-NLP/opus-mt-vi-en** - Vietnamese to English
- **Tên Model**: `Helsinki-NLP/opus-mt-vi-en`
- **Mục đích**: Dịch từ tiếng Việt sang tiếng Anh
- **Kiến trúc**: MarianMT (Transformer-based)
- **Nguồn**: [HuggingFace Model Hub](https://huggingface.co/Helsinki-NLP/opus-mt-vi-en)
- **Bài báo**: 
  - "OPUS-MT – Building open translation services for the World"
  - Tiedemann & Thottingal, 2020
- **Dataset**: OPUS parallel corpora
- **BLEU Score**: ~25-30 (Vi-En)

#### **Helsinki-NLP/opus-mt-en-vi** - English to Vietnamese  
- **Tên Model**: `Helsinki-NLP/opus-mt-en-vi`
- **Mục đích**: Dịch từ tiếng Anh sang tiếng Việt
- **Kiến trúc**: MarianMT (Transformer-based)
- **Nguồn**: [HuggingFace Model Hub](https://huggingface.co/Helsinki-NLP/opus-mt-en-vi)
- **Dataset**: OPUS parallel corpora
- **BLEU Score**: ~20-25 (En-Vi)

---

### 4. 🎯 Căn chỉnh từ (Word Alignment)

#### **SimAlign BERT** - Sentence Aligner
- **Model Base**: `bert-base-multilingual-cased`
- **Mục đích**: Căn chỉnh từ giữa câu tiếng Việt và tiếng Anh
- **Phương pháp**: Similarity-based alignment
- **Nguồn**: [SimAlign GitHub](https://github.com/cisnlp/simalign)
- **Bài báo**: 
  - "SimAlign: High Quality Word Alignments without Parallel Training Data"
  - Jalili Sabet et al., EMNLP 2020
- **Độ chính xác**: AER ~15-20% (tùy ngôn ngữ)

#### **AWESOME-Align** - Advanced Word Alignment
- **Model Base**: `bert-base-multilingual-cased`
- **Mục đích**: Căn chỉnh từ chất lượng cao với BERT
- **Kiến trúc**: Custom BERT với alignment heads
- **Nguồn**: [AWESOME-Align GitHub](https://github.com/neulab/awesome-align)
- **Bài báo**: 
  - "Awesome Align: Aligning Word Embedding Spaces of Multilingual Encoders"
  - Dou & Neubig, 2021, NAACL
- **Độ chính xác**: AER 13.4% (Zh-En), 4.1% (Fr-En)

---

### 5. 🧠 Phân tích ngữ nghĩa (Semantic Analysis)

#### **BERT Multilingual** - Semantic Embeddings
- **Tên Model**: `bert-base-multilingual-cased`
- **Mục đích**: Tạo embedding ngữ nghĩa cho từ và câu
- **Kiến trúc**: BERT Base (12 layers, 768 hidden, 12 heads)
- **Ngôn ngữ**: 104 ngôn ngữ (bao gồm tiếng Việt, Anh)
- **Nguồn**: [HuggingFace Transformers](https://huggingface.co/bert-base-multilingual-cased)
- **Bài báo**: 
  - "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding"
  - Devlin et al., 2019, NAACL

#### **Sentence-BERT Multilingual** - Sentence Embeddings
- **Tên Model**: `sentence-transformers/paraphrase-multilingual-mpnet-base-v2`
- **Mục đích**: Tạo embedding câu cho alignment ngữ nghĩa
- **Kiến trúc**: MPNet-based with siamese networks
- **Nguồn**: [Sentence-Transformers](https://www.sbert.net/)
- **Bài báo**: 
  - "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks"
  - Reimers & Gurevych, 2019, EMNLP
- **Hiệu suất**: 84.2% accuracy trên STS benchmark

---

### 6. 🏷️ Phân loại và NER nâng cao

#### **GLiNER** - Generalist Named Entity Recognition
- **Tên Model**: `urchade/gliner_small-v1`
- **Mục đích**: NER linh hoạt với các nhãn tùy chỉnh
- **Kiến trúc**: Encoder-decoder with span classification
- **Nguồn**: [GLiNER GitHub](https://github.com/urchade/GLiNER)
- **Bài báo**: 
  - "GLiNER: Generalist Model for Named Entity Recognition"
  - Urchade et al., 2024

#### **BERT-large-NER** - Advanced English NER
- **Tên Model**: `dslim/bert-large-NER`
- **Mục đích**: NER chất lượng cao cho tiếng Anh
- **Labels**: PERSON, LOCATION, ORGANIZATION, MISCELLANEOUS
- **Nguồn**: [HuggingFace](https://huggingface.co/dslim/bert-large-NER)
- **F1 Score**: 91.3% trên CoNLL-2003

---

### 7. 💬 AI Chat Assistant

#### **Mistral** - Conversational AI
- **Mục đích**: Trả lời câu hỏi về dữ liệu và phân tích
- **Kiến trúc**: Transformer-based language model
- **Deployment**: Local via Ollama
- **Nguồn**: [Ollama](https://ollama.ai/), [Mistral AI](https://mistral.ai/)
- **Tham số**: 7B parameters
- **Sử dụng**: Chat interface cho data analysis

---

### 8. 📊 Explainable AI (XAI)

#### **Decision Tree Classifier** - Feature Importance
- **Thư viện**: scikit-learn
- **Mục đích**: Phân tích tầm quan trọng của features
- **Cấu hình**: `max_depth=3, random_state=42`
- **Ứng dụng**: Giải thích kết quả phân tích dữ liệu

---

## 🗂️ Tổ chức Models trong Code

### File Structure
```
parallel-corpus/
├── app.py                          # Streamlit app với tất cả models
├── appPhoBert.py                   # Version với BERT optimization
├── scripts/
│   ├── analyze_text.py            # Main analysis với translation models
│   ├── semantic_alignment_v2.py   # Sentence-BERT alignment
│   ├── phrase_chunker.py          # spaCy + GLiNER chunking
│   ├── ai_chat_hf.py             # Mistral chat integration
│   ├── xai_analysis.py           # Decision tree XAI
│   └── awesome-align/            # AWESOME-Align toolkit
├── requirements.txt               # Tất cả model dependencies
└── setup.sh                     # Auto-download tất cả models
```

### Dependencies chính
```python
transformers>=4.30.0    # HuggingFace models
torch>=2.0.0           # PyTorch backend
spacy>=3.5.0           # spaCy models
underthesea>=1.3.0     # Vietnamese NLP
simalign>=0.3.0        # Word alignment
sentence-transformers  # Sentence embeddings
scikit-learn          # ML algorithms
```

---

## 📈 Hiệu suất Models

| Model | Task | Language | Accuracy/Score | Note |
|-------|------|----------|---------------|------|
| spaCy en_core_web_sm | POS Tagging | English | 97.2% | Penn Treebank |
| BERT-large-NER | NER | English | 91.3% F1 | CoNLL-2003 |
| Helsinki-NLP vi-en | Translation | Vi→En | ~25-30 BLEU | OPUS dataset |
| Helsinki-NLP en-vi | Translation | En→Vi | ~20-25 BLEU | OPUS dataset |
| AWESOME-Align | Word Alignment | Multi | 4.1% AER (Fr-En) | Best multilingual |
| Sentence-BERT | Sentence Sim | Multi | 84.2% | STS benchmark |

---

## 🚀 Cài đặt và Sử dụng

### Tự động (Khuyến nghị)
```bash
chmod +x setup.sh
./setup.sh
```

### Thủ công
```bash
# Core dependencies
pip install -r requirements.txt

# spaCy English model  
python -m spacy download en_core_web_sm

# Underthesea (auto-download models)
pip install underthesea

# Optional: Ollama for local chat
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull mistral
```

---

## 📚 Tài liệu tham khảo

### Bài báo chính
1. **Underthesea**: Vu Anh et al. "Underthesea: An Open Source Toolkit for Vietnamese Natural Language Processing" (2018)

2. **OPUS-MT**: Tiedemann, J., & Thottingal, S. "OPUS-MT – Building open translation services for the World" (2020)

3. **SimAlign**: Jalili Sabet, M., et al. "SimAlign: High Quality Word Alignments without Parallel Training Data" EMNLP 2020

4. **AWESOME-Align**: Dou, Z., & Neubig, G. "Word Alignment by Fine-tuning Embeddings on Parallel Corpora" NAACL 2021

5. **BERT**: Devlin, J., et al. "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding" NAACL 2019

6. **Sentence-BERT**: Reimers, N., & Gurevych, I. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks" EMNLP 2019

### GitHub Repositories
- [Underthesea](https://github.com/undertheseanlp/underthesea)
- [spaCy](https://github.com/explosion/spaCy)
- [SimAlign](https://github.com/cisnlp/simalign)
- [AWESOME-Align](https://github.com/neulab/awesome-align)
- [Sentence-Transformers](https://github.com/UKPLab/sentence-transformers)
- [GLiNER](https://github.com/urchade/GLiNER)

### Model Hubs
- [HuggingFace Models](https://huggingface.co/models)
- [spaCy Models](https://spacy.io/models)
- [OPUS Models](https://opus.nlpl.eu/)

---

## 🔧 Cấu hình Model

### Memory Requirements
- **Minimum RAM**: 8GB
- **Recommended RAM**: 16GB+
- **GPU**: Optional (CUDA-compatible for faster inference)
- **Storage**: ~5GB cho tất cả models

### Performance Optimization
```python
# BERT optimization
torch.backends.cudnn.benchmark = True
torch.set_num_threads(4)

# spaCy optimization  
nlp.max_length = 2000000
nlp.disable_pipes("parser", "tagger")  # Disable unused pipes
```

---

## 📞 Hỗ trợ

- **Documentation**: Xem `README.md` và `RUN_LOCAL.md`
- **Issues**: Báo cáo lỗi trong project repository
- **Models**: Kiểm tra HuggingFace Model Hub cho updates

---

**Cập nhật cuối**: Jul 2026  
**Tổng số models**: 12+ models được tích hợp đầy đủ 