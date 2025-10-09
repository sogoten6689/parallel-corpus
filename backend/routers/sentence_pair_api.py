from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from database import get_db
from auth import get_current_user
from models.user import User, UserRole
from models.row_word import RowWord
from models.master_row_word import MasterRowWord
from services.vietnamese_nlp_service import vietnamese_nlp_service
from services.pos_ner_mapping import map_pos_tag, map_ner_label
import spacy

router = APIRouter(prefix="/sentence-pairs", tags=["sentence-pairs"])

# In-memory storage for sentence pairs (in production, use database)
sentence_pairs_storage: Dict[str, Dict[str, Any]] = {}
pending_approvals: Dict[str, Dict[str, Any]] = {}

# Initialize spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

# Pydantic models
class CreateSentencePairRequest(BaseModel):
    vietnameseText: str
    englishText: str
    langPair: str

class WordAnalysis(BaseModel):
    word: str
    lemma: str
    links: str
    morph: str
    pos: str
    phrase: str
    grm: str
    ner: str
    semantic: str
    langCode: str

class SaveSentencePairRequest(BaseModel):
    sentenceId: str
    vietnameseAnalysis: List[WordAnalysis]
    englishAnalysis: List[WordAnalysis]
    langPair: str

class SentencePairResponse(BaseModel):
    id: str
    sentenceId: str
    vietnameseText: str
    englishText: str
    langPair: str
    vietnameseAnalysis: Optional[List[WordAnalysis]] = None
    englishAnalysis: Optional[List[WordAnalysis]] = None
    status: str
    createdBy: Optional[int] = None
    approvalBy: Optional[int] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

@router.post("/", response_model=SentencePairResponse)
async def create_sentence_pair(
    request: CreateSentencePairRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Create a new sentence pair for analysis"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    sentence_id = str(uuid.uuid4())
    pair_id = str(uuid.uuid4())
    
    sentence_pair = {
        "id": pair_id,
        "sentenceId": sentence_id,
        "vietnameseText": request.vietnameseText,
        "englishText": request.englishText,
        "langPair": request.langPair,
        "status": "draft",
        "createdBy": current_user.id,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    sentence_pairs_storage[pair_id] = sentence_pair
    
    return SentencePairResponse(**sentence_pair)


@router.post("/save")
async def save_sentence_pair(
    request: SaveSentencePairRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save sentence pair with analysis results to row_words table"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Save Vietnamese words to row_words
        for i, word_analysis in enumerate(request.vietnameseAnalysis):
            row_word = RowWord(
                id=f"{request.sentenceId}_vi_{i:03d}",
                id_sen=request.sentenceId,
                word=word_analysis.word,
                lemma=word_analysis.lemma,
                links=word_analysis.links,
                morph=word_analysis.morph,
                pos=word_analysis.pos,
                phrase=word_analysis.phrase,
                grm=word_analysis.grm,
                ner=word_analysis.ner,
                semantic=word_analysis.semantic,
                lang_code=word_analysis.langCode
            )
            db.add(row_word)
        
        # Save English words to row_words
        for i, word_analysis in enumerate(request.englishAnalysis):
            row_word = RowWord(
                id=f"{request.sentenceId}_en_{i:03d}",
                id_sen=request.sentenceId,
                word=word_analysis.word,
                lemma=word_analysis.lemma,
                links=word_analysis.links,
                morph=word_analysis.morph,
                pos=word_analysis.pos,
                phrase=word_analysis.phrase,
                grm=word_analysis.grm,
                ner=word_analysis.ner,
                semantic=word_analysis.semantic,
                lang_code=word_analysis.langCode
            )
            db.add(row_word)
        
        db.commit()
        
        # Move to pending approval
        pair_id = None
        for pid, pair in sentence_pairs_storage.items():
            if pair["sentenceId"] == request.sentenceId:
                pair_id = pid
                break
        
        if pair_id:
            sentence_pairs_storage[pair_id]["status"] = "pending"
            sentence_pairs_storage[pair_id]["updatedAt"] = datetime.now().isoformat()
            pending_approvals[request.sentenceId] = sentence_pairs_storage[pair_id]
        
        return {"message": "Sentence pair saved successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save sentence pair: {str(e)}")

@router.get("/", response_model=Dict[str, Any])
async def get_sentence_pairs(
    page: int = 1,
    limit: int = 10,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get all sentence pairs for current user"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_pairs = [
        SentencePairResponse(**pair) for pair in sentence_pairs_storage.values()
        if pair["createdBy"] == current_user.id
    ]
    
    total = len(user_pairs)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    data = user_pairs[start_idx:end_idx]
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/{sentence_id}/analysis", response_model=Dict[str, Any])
async def get_sentence_pair_analysis(
    sentence_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch analyzed tokens for a sentence pair from row_words by id_sen."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        rows = db.query(RowWord).filter(RowWord.id_sen == sentence_id).all()
        vi: List[Dict[str, Any]] = []
        en: List[Dict[str, Any]] = []
        for r in rows:
            item = {
                "word": r.word,
                "lemma": r.lemma or r.word,
                "links": r.links or "",
                "morph": r.morph or "",
                "pos": r.pos or "",
                "phrase": r.phrase or "",
                "grm": r.grm or "",
                "ner": r.ner or "",
                "semantic": r.semantic or "",
                "langCode": r.lang_code,
            }
            if r.lang_code == "vi":
                vi.append(item)
            else:
                en.append(item)

        return {
            "vietnameseAnalysis": vi,
            "englishAnalysis": en,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load analysis: {e}")

@router.get("/pending", response_model=Dict[str, Any])
async def get_pending_sentence_pairs(
    page: int = 1,
    limit: int = 10,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get sentence pairs pending approval (admin only)"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pending_list = list(pending_approvals.values())
    total = len(pending_list)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    data = pending_list[start_idx:end_idx]
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.delete("/{pair_id}")
async def delete_sentence_pair(
    pair_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a sentence pair"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if pair_id not in sentence_pairs_storage:
        raise HTTPException(status_code=404, detail="Sentence pair not found")
    
    pair = sentence_pairs_storage[pair_id]
    
    # Check if user owns this pair or is admin
    if pair["createdBy"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete from row_words if saved
    if pair["status"] in ["pending", "approved"]:
        # For approved pairs, also delete from master_row_words first
        if pair["status"] == "approved":
            db.query(MasterRowWord).filter(MasterRowWord.id_sen == pair["sentenceId"]).delete()
        
        # Then delete from row_words
        db.query(RowWord).filter(RowWord.id_sen == pair["sentenceId"]).delete()
        db.commit()
    
    # Remove from storage
    del sentence_pairs_storage[pair_id]
    if pair["sentenceId"] in pending_approvals:
        del pending_approvals[pair["sentenceId"]]
    
    return {"message": "Sentence pair deleted successfully"}

@router.post("/{pair_id}/approve")
async def approve_sentence_pair(
    pair_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a sentence pair (admin only)"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if pair_id not in pending_approvals:
        raise HTTPException(status_code=404, detail="Sentence pair not found in pending approvals")
    
    sentence_id = pair_id
    
    try:
        # Move from row_words to master_row_words
        row_words = db.query(RowWord).filter(RowWord.id_sen == sentence_id).all()
        
        # First, create master_row_words
        for row_word in row_words:
            master_row_word = MasterRowWord(
                id_string=row_word.id,
                row_word_id=row_word.id,
                id_sen=row_word.id_sen,
                word=row_word.word,
                lemma=row_word.lemma,
                links=row_word.links,
                morph=row_word.morph,
                pos=row_word.pos,
                phrase=row_word.phrase,
                grm=row_word.grm,
                ner=row_word.ner,
                semantic=row_word.semantic,
                lang_code=row_word.lang_code,
                lang_pair=pending_approvals[sentence_id]["langPair"],
                create_by=pending_approvals[sentence_id]["createdBy"],
                approval_by=current_user.id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(master_row_word)
        
        # Commit master_row_words first
        db.commit()
        
        # Note: We don't delete from row_words to avoid foreign key constraint issues
        # The master_row_words table references row_words, so we keep both
        
        # Update status
        pending_approvals[sentence_id]["status"] = "approved"
        pending_approvals[sentence_id]["approvalBy"] = current_user.id
        pending_approvals[sentence_id]["updatedAt"] = datetime.now().isoformat()
        
        # Update in main storage
        for pid, pair in sentence_pairs_storage.items():
            if pair["sentenceId"] == sentence_id:
                sentence_pairs_storage[pid] = pending_approvals[sentence_id]
                break
        
        # Final commit for status update and row_words deletion
        db.commit()
        
        return {"message": "Sentence pair approved successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve sentence pair: {str(e)}")

@router.post("/{pair_id}/reject")
async def reject_sentence_pair(
    pair_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a sentence pair (admin only)"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if pair_id not in pending_approvals:
        raise HTTPException(status_code=404, detail="Sentence pair not found in pending approvals")
    
    sentence_id = pair_id
    
    try:
        # Remove from row_words
        db.query(RowWord).filter(RowWord.id_sen == sentence_id).delete()
        
        # Update status
        pending_approvals[sentence_id]["status"] = "rejected"
        pending_approvals[sentence_id]["approvalBy"] = current_user.id
        pending_approvals[sentence_id]["updatedAt"] = datetime.now().isoformat()
        
        # Update in main storage
        for pid, pair in sentence_pairs_storage.items():
            if pair["sentenceId"] == sentence_id:
                sentence_pairs_storage[pid] = pending_approvals[sentence_id]
                break
        
        db.commit()
        
        return {"message": "Sentence pair rejected successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reject sentence pair: {str(e)}")

@router.get("/{pair_id}/analysis")
async def get_sentence_pair_analysis(
    pair_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis results for a sentence pair"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find the sentence pair
    pair = None
    for p in sentence_pairs_storage.values():
        if p["id"] == pair_id:
            pair = p
            break
    
    if not pair:
        raise HTTPException(status_code=404, detail="Sentence pair not found")
    
    # Check if user can access this pair
    if pair["created_by"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get row words for this sentence
    row_words = db.query(RowWord).filter(RowWord.id_sen == pair["sentence_id"]).all()
    
    vietnamese_words = [rw for rw in row_words if rw.lang_code == "vi"]
    english_words = [rw for rw in row_words if rw.lang_code == "en"]
    
    return {
        "vietnamese_analysis": vietnamese_words,
        "english_analysis": english_words
    }
