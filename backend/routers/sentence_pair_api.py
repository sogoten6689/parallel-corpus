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
    vietnamese_text: str
    english_text: str
    lang_pair: str

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
    lang_code: str

class SaveSentencePairRequest(BaseModel):
    sentence_id: str
    vietnamese_analysis: List[WordAnalysis]
    english_analysis: List[WordAnalysis]
    lang_pair: str

class SentencePairResponse(BaseModel):
    id: str
    sentence_id: str
    vietnamese_text: str
    english_text: str
    lang_pair: str
    vietnamese_analysis: Optional[List[WordAnalysis]] = None
    english_analysis: Optional[List[WordAnalysis]] = None
    status: str
    created_by: Optional[int] = None
    approval_by: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

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
        "sentence_id": sentence_id,
        "vietnamese_text": request.vietnamese_text,
        "english_text": request.english_text,
        "lang_pair": request.lang_pair,
        "status": "draft",
        "created_by": current_user.id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
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
        for i, word_analysis in enumerate(request.vietnamese_analysis):
            row_word = RowWord(
                id=f"{request.sentence_id}_vi_{i:03d}",
                id_sen=request.sentence_id,
                word=word_analysis.word,
                lemma=word_analysis.lemma,
                links=word_analysis.links,
                morph=word_analysis.morph,
                pos=word_analysis.pos,
                phrase=word_analysis.phrase,
                grm=word_analysis.grm,
                ner=word_analysis.ner,
                semantic=word_analysis.semantic,
                lang_code="vi"
            )
            db.add(row_word)
        
        # Save English words to row_words
        for i, word_analysis in enumerate(request.english_analysis):
            row_word = RowWord(
                id=f"{request.sentence_id}_en_{i:03d}",
                id_sen=request.sentence_id,
                word=word_analysis.word,
                lemma=word_analysis.lemma,
                links=word_analysis.links,
                morph=word_analysis.morph,
                pos=word_analysis.pos,
                phrase=word_analysis.phrase,
                grm=word_analysis.grm,
                ner=word_analysis.ner,
                semantic=word_analysis.semantic,
                lang_code="en"
            )
            db.add(row_word)
        
        db.commit()
        
        # Move to pending approval
        pair_id = None
        for pid, pair in sentence_pairs_storage.items():
            if pair["sentence_id"] == request.sentence_id:
                pair_id = pid
                break
        
        if pair_id:
            sentence_pairs_storage[pair_id]["status"] = "pending"
            sentence_pairs_storage[pair_id]["updated_at"] = datetime.now().isoformat()
            pending_approvals[request.sentence_id] = sentence_pairs_storage[pair_id]
        
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
        pair for pair in sentence_pairs_storage.values()
        if pair["created_by"] == current_user.id
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
    if pair["created_by"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete from row_words if saved
    if pair["status"] in ["pending", "approved"]:
        db.query(RowWord).filter(RowWord.id_sen == pair["sentence_id"]).delete()
        db.commit()
    
    # Remove from storage
    del sentence_pairs_storage[pair_id]
    if pair["sentence_id"] in pending_approvals:
        del pending_approvals[pair["sentence_id"]]
    
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
    
    sentence_id = None
    for pid, pair in pending_approvals.items():
        if pair["id"] == pair_id:
            sentence_id = pid
            break
    
    if not sentence_id:
        raise HTTPException(status_code=404, detail="Sentence pair not found in pending approvals")
    
    try:
        # Move from row_words to master_row_words
        row_words = db.query(RowWord).filter(RowWord.id_sen == sentence_id).all()
        
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
                lang_pair=pending_approvals[sentence_id]["lang_pair"],
                create_by=pending_approvals[sentence_id]["created_by"],
                approval_by=current_user.id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(master_row_word)
        
        # Remove from row_words
        db.query(RowWord).filter(RowWord.id_sen == sentence_id).delete()
        
        # Update status
        pending_approvals[sentence_id]["status"] = "approved"
        pending_approvals[sentence_id]["approval_by"] = current_user.id
        pending_approvals[sentence_id]["updated_at"] = datetime.now().isoformat()
        
        # Update in main storage
        for pid, pair in sentence_pairs_storage.items():
            if pair["sentence_id"] == sentence_id:
                sentence_pairs_storage[pid] = pending_approvals[sentence_id]
                break
        
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
    
    sentence_id = None
    for pid, pair in pending_approvals.items():
        if pair["id"] == pair_id:
            sentence_id = pid
            break
    
    if not sentence_id:
        raise HTTPException(status_code=404, detail="Sentence pair not found in pending approvals")
    
    try:
        # Remove from row_words
        db.query(RowWord).filter(RowWord.id_sen == sentence_id).delete()
        
        # Update status
        pending_approvals[sentence_id]["status"] = "rejected"
        pending_approvals[sentence_id]["approval_by"] = current_user.id
        pending_approvals[sentence_id]["updated_at"] = datetime.now().isoformat()
        
        # Update in main storage
        for pid, pair in sentence_pairs_storage.items():
            if pair["sentence_id"] == sentence_id:
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
