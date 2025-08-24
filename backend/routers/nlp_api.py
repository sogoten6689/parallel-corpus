from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
import spacy
import logging

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
                tokens.append(TokenInfo(
                    text=token.text,
                    pos=token.pos_,
                    pos_explanation=spacy.explain(token.pos_),
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
            entities.append(EntityInfo(
                text=ent.text,
                label=ent.label_,
                label_explanation=spacy.explain(ent.label_),
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
            }
        ],
        "note": "To add more languages, install additional spaCy models using: python -m spacy download [model_name]"
    }
