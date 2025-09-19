from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import spacy
import logging
from services.vietnamese_nlp_service import vietnamese_nlp_service
from services.pos_ner_mapping import map_pos_tag, map_ner_label, get_all_pos_tags, get_all_ner_labels

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Khởi tạo spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("SpaCy model 'en_core_web_sm' loaded successfully")
except OSError:
    logger.warning("SpaCy model 'en_core_web_sm' not found. Please install it using: python -m spacy download en_core_web_sm")
    nlp = None

# Pydantic models
class TextRequest(BaseModel):
    text: str
    language: str = "en"  # Default to English

class TokenInfo(BaseModel):
    text: str
    pos: str
    pos_explanation: str
    lemma: str
    dep: str
    head: str

class EntityInfo(BaseModel):
    text: str
    label: str
    label_explanation: str
    start: int
    end: int

class SentenceInfo(BaseModel):
    text: str
    tokens: List[TokenInfo]

class VietnameseTokenInfo(BaseModel):
    text: str
    pos: str
    pos_explanation: str
    lemma: str
    dep: str
    head: int
    index: int

class VietnameseSentenceInfo(BaseModel):
    text: str
    tokens: List[VietnameseTokenInfo]

class VietnameseEntityInfo(BaseModel):
    text: str
    label: str
    label_explanation: str
    start: int
    end: int

class VietnameseNLPResponse(BaseModel):
    original_text: str
    sentences: List[VietnameseSentenceInfo]
    entities: List[VietnameseEntityInfo]
    token_count: int
    sentence_count: int

class DependencyInfo(BaseModel):
    text: str
    pos: str
    head: int
    dep_label: str
    index: int

class NLPResponse(BaseModel):
    original_text: str
    sentences: List[SentenceInfo]
    entities: List[EntityInfo]
    token_count: int
    sentence_count: int

@router.post("/tokenize", response_model=List[str])
async def tokenize_text(request: TextRequest):
    """
    Tokenize text into individual tokens/words
    """
    if not nlp:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP model not available. Please ensure spaCy model is installed."
        )
    
    try:
        doc = nlp(request.text)
        tokens = [token.text for token in doc]
        return tokens
    except Exception as e:
        logger.error(f"Error in tokenization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during tokenization: {str(e)}"
        )

@router.post("/pos-tagging", response_model=List[Dict[str, str]])
async def pos_tagging(request: TextRequest):
    """
    Perform Part-of-Speech tagging on text
    """
    if not nlp:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP model not available. Please ensure spaCy model is installed."
        )
    
    try:
        doc = nlp(request.text)
        pos_tags = []
        
        for token in doc:
            pos_tags.append({
                "text": token.text,
                "pos": token.pos_,
                "pos_explanation": spacy.explain(token.pos_),
                "tag": token.tag_,
                "tag_explanation": spacy.explain(token.tag_)
            })
        
        return pos_tags
    except Exception as e:
        logger.error(f"Error in POS tagging: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during POS tagging: {str(e)}"
        )

@router.post("/lemmatize", response_model=List[Dict[str, str]])
async def lemmatize_text(request: TextRequest):
    """
    Perform lemmatization on text tokens
    """
    if not nlp:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP model not available. Please ensure spaCy model is installed."
        )
    
    try:
        doc = nlp(request.text)
        lemmas = []
        
        for token in doc:
            lemmas.append({
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                "is_alpha": token.is_alpha,
                "is_stop": token.is_stop
            })
        
        return lemmas
    except Exception as e:
        logger.error(f"Error in lemmatization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during lemmatization: {str(e)}"
        )

@router.post("/ner", response_model=List[EntityInfo])
async def named_entity_recognition(request: TextRequest):
    """
    Perform Named Entity Recognition on text
    """
    if not nlp:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP model not available. Please ensure spaCy model is installed."
        )
    
    try:
        doc = nlp(request.text)
        entities = []
        
        for ent in doc.ents:
            entities.append(EntityInfo(
                text=ent.text,
                label=ent.label_,
                label_explanation=spacy.explain(ent.label_),
                start=ent.start_char,
                end=ent.end_char
            ))
        
        return entities
    except Exception as e:
        logger.error(f"Error in NER: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during NER: {str(e)}"
        )

@router.post("/analyze", response_model=NLPResponse)
async def full_text_analysis(request: TextRequest):
    """
    Perform complete text analysis including tokenization, POS tagging, lemmatization, and NER
    """
    if not nlp:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP model not available. Please ensure spaCy model is installed."
        )
    
    try:
        doc = nlp(request.text)
        
        # Process sentences
        sentences = []
        for sent in doc.sents:
            tokens = []
            for token in sent:
                # Map POS tag to specific value
                specific_pos, pos_explanation = map_pos_tag(token.pos_, "en")
                
                tokens.append(TokenInfo(
                    text=token.text,
                    pos=specific_pos,
                    pos_explanation=pos_explanation,
                    lemma=token.lemma_,
                    dep=token.dep_,
                    head=token.head.text
                ))
            
            sentences.append(SentenceInfo(
                text=sent.text,
                tokens=tokens
            ))
        
        # Process entities
        entities = []
        for ent in doc.ents:
            # Map NER label to specific value
            specific_ner, ner_explanation = map_ner_label(ent.label_, "en")
            
            entities.append(EntityInfo(
                text=ent.text,
                label=specific_ner,
                label_explanation=ner_explanation,
                start=ent.start_char,
                end=ent.end_char
            ))
        
        return NLPResponse(
            original_text=request.text,
            sentences=sentences,
            entities=entities,
            token_count=len(doc),
            sentence_count=len(list(doc.sents))
        )
        
    except Exception as e:
        logger.error(f"Error in full text analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during text analysis: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Check if NLP service is available
    """
    if nlp:
        return {
            "status": "healthy",
            "model": "en_core_web_sm",
            "message": "NLP service is running"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP model not available"
        )

# Vietnamese NLP Endpoints

@router.post("/vietnamese/word-segmentation", response_model=List[str])
async def vietnamese_word_segmentation(request: TextRequest):
    """
    Perform word segmentation on Vietnamese text using VnCoreNLP
    """
    if not vietnamese_nlp_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vietnamese NLP service not available. Please ensure VnCoreNLP is properly installed."
        )
    
    try:
        words = vietnamese_nlp_service.word_segmentation(request.text)
        return words
    except Exception as e:
        logger.error(f"Error in Vietnamese word segmentation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Vietnamese word segmentation: {str(e)}"
        )

@router.post("/vietnamese/pos-tagging", response_model=List[Dict[str, str]])
async def vietnamese_pos_tagging(request: TextRequest):
    """
    Perform Part-of-Speech tagging on Vietnamese text using VnCoreNLP
    """
    if not vietnamese_nlp_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vietnamese NLP service not available. Please ensure VnCoreNLP is properly installed."
        )
    
    try:
        pos_tags = vietnamese_nlp_service.pos_tagging(request.text)
        return pos_tags
    except Exception as e:
        logger.error(f"Error in Vietnamese POS tagging: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Vietnamese POS tagging: {str(e)}"
        )

@router.post("/vietnamese/ner", response_model=List[VietnameseEntityInfo])
async def vietnamese_named_entity_recognition(request: TextRequest):
    """
    Perform Named Entity Recognition on Vietnamese text using VnCoreNLP
    """
    if not vietnamese_nlp_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vietnamese NLP service not available. Please ensure VnCoreNLP is properly installed."
        )
    
    try:
        entities = vietnamese_nlp_service.named_entity_recognition(request.text)
        return [VietnameseEntityInfo(**entity) for entity in entities]
    except Exception as e:
        logger.error(f"Error in Vietnamese NER: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Vietnamese NER: {str(e)}"
        )

@router.post("/vietnamese/dependency-parsing", response_model=List[List[DependencyInfo]])
async def vietnamese_dependency_parsing(request: TextRequest):
    """
    Perform dependency parsing on Vietnamese text using VnCoreNLP
    """
    if not vietnamese_nlp_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vietnamese NLP service not available. Please ensure VnCoreNLP is properly installed."
        )
    
    try:
        dependencies = vietnamese_nlp_service.dependency_parsing(request.text)
        return [[DependencyInfo(**dep) for dep in sentence_deps] for sentence_deps in dependencies]
    except Exception as e:
        logger.error(f"Error in Vietnamese dependency parsing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Vietnamese dependency parsing: {str(e)}"
        )

@router.post("/vietnamese/analyze", response_model=VietnameseNLPResponse)
async def vietnamese_full_analysis(request: TextRequest):
    """
    Perform complete Vietnamese text analysis including word segmentation, POS tagging, NER, and dependency parsing
    """
    if not vietnamese_nlp_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vietnamese NLP service not available. Please ensure VnCoreNLP is properly installed."
        )
    
    try:
        analysis_result = vietnamese_nlp_service.full_analysis(request.text)
        
        # Convert to Pydantic models
        sentences = []
        for sent in analysis_result["sentences"]:
            tokens = [VietnameseTokenInfo(**token) for token in sent["tokens"]]
            sentences.append(VietnameseSentenceInfo(
                text=sent["text"],
                tokens=tokens
            ))
        
        entities = [VietnameseEntityInfo(**entity) for entity in analysis_result["entities"]]
        
        return VietnameseNLPResponse(
            original_text=analysis_result["original_text"],
            sentences=sentences,
            entities=entities,
            token_count=analysis_result["token_count"],
            sentence_count=analysis_result["sentence_count"]
        )
        
    except Exception as e:
        logger.error(f"Error in Vietnamese full analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Vietnamese text analysis: {str(e)}"
        )

@router.get("/supported-languages")
async def get_supported_languages():
    """
    Get list of supported languages/models
    """
    return {
        "supported_languages": [
            {
                "code": "en",
                "name": "English",
                "model": "en_core_web_sm",
                "status": "available" if nlp else "not_installed"
            },
            {
                "code": "vi",
                "name": "Vietnamese",
                "model": "VnCoreNLP",
                "status": "available" if vietnamese_nlp_service.is_available() else "not_installed"
            }
        ],
        "note": "To add more languages, install additional spaCy models using: python -m spacy download [model_name]"
    }

@router.get("/pos-tags/{language}")
async def get_pos_tags(language: str):
    """
    Get all available POS tags for a specific language
    
    Args:
        language: Language code ("en" or "vi")
    """
    if language not in ["en", "vi"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language must be 'en' or 'vi'"
        )
    
    pos_tags = get_all_pos_tags(language)
    return {
        "language": language,
        "pos_tags": pos_tags,
        "count": len(pos_tags)
    }

@router.get("/ner-labels/{language}")
async def get_ner_labels(language: str):
    """
    Get all available NER labels for a specific language
    
    Args:
        language: Language code ("en" or "vi")
    """
    if language not in ["en", "vi"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language must be 'en' or 'vi'"
        )
    
    ner_labels = get_all_ner_labels(language)
    return {
        "language": language,
        "ner_labels": ner_labels,
        "count": len(ner_labels)
    }
