from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
import pandas as pd
import io
import os
import tempfile
from datetime import datetime
from database import get_db
from auth import get_current_user
from models.user import User
from models.rowword import RowWord
from models.sentence import Sentence
from models.point import Point

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Supported export formats
SUPPORTED_FORMATS = {
    'txt': 'text/plain',
    'csv': 'text/csv', 
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel'
}

def validate_export_format(format_type: str) -> bool:
    """Validate if export format is supported"""
    return format_type.lower() in SUPPORTED_FORMATS

def get_export_filename(prefix: str, format_type: str) -> str:
    """Generate export filename with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.{format_type}"

def export_to_txt(data: List[dict]) -> str:
    """Export data to TXT format with tab separation"""
    if not data:
        return ""
    
    # Get column headers from first row
    headers = list(data[0].keys())
    
    # Create content with headers first
    lines = ['\t'.join(headers)]  # Add header line
    
    # Add data rows
    for row in data:
        line = '\t'.join(str(row.get(header, '')) for header in headers)
        lines.append(line)
    
    return '\n'.join(lines)

def export_to_csv(data: List[dict]) -> str:
    """Export data to CSV format"""
    if not data:
        return ""
    
    df = pd.DataFrame(data)
    output = io.StringIO()
    df.to_csv(output, index=False, sep=',')
    return output.getvalue()

def export_to_excel(data: List[dict], format_type: str) -> bytes:
    """Export data to Excel format"""
    if not data:
        return b""
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    
    # Use openpyxl for both formats since xlwt is deprecated
    df.to_excel(output, index=False, engine='openpyxl')
    
    return output.getvalue()

@router.get("/export/check-auth", 
    summary="Check Export Authentication",
    description="Verify if the current user is authenticated to use export functionality. Returns user information if authenticated, otherwise returns a login requirement message.",
    response_description="Authentication status and user information"
)
async def check_export_auth(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng export / Please login to use export functionality",
                "requires_login": True,
                "login_url": "/auth/login"
            }
        )
    
    return {
        "message": "Đã đăng nhập thành công / Successfully authenticated",
        "requires_login": False,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value if current_user.role else None,
            "organization": current_user.organization,
            "work_unit": getattr(current_user, 'work_unit', None),
            "status": getattr(current_user, 'status', None)
        }
    }

@router.get("/export/rowwords",
    summary="Export Row Words Data",
    description="Export row words data in specified format (TXT, CSV, or Excel). Requires authentication and supports filtering.",
    response_description="Exported file in requested format"
)
async def export_rowwords(
    format_type: str = Query(..., description="Export format: txt, csv, xlsx, or xls"),
    language: Optional[str] = Query(None, description="Filter by language"),
    pos_tag: Optional[str] = Query(None, description="Filter by POS tag"),
    limit: Optional[int] = Query(1000, description="Maximum number of records to export"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng export / Please login to use export functionality",
                "requires_login": True,
                "login_url": "/auth/login"
            }
        )
    
    # Validate export format
    if not validate_export_format(format_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"Export format '{format_type}' not supported",
                "supported_formats": list(SUPPORTED_FORMATS.keys())
            }
        )
    
    try:
        # Build query
        query = db.query(RowWord)

        # Map API filters to actual model columns
        if language:
            query = query.filter(RowWord.Lang_code == language)

        if pos_tag:
            query = query.filter(RowWord.POS == pos_tag)

        # Apply limit
        query = query.limit(limit)

        # Execute query
        row_words = query.all()

        if not row_words:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No data found matching the specified criteria"
            )

        # Convert to list of dictionaries using actual model attributes
        data = []
        for rw in row_words:
            data.append({
                "ID": getattr(rw, "ID", None) or "",
                "ID_sen": getattr(rw, "ID_sen", None) or "",
                "Word": getattr(rw, "Word", None) or "",
                "Lemma": getattr(rw, "Lemma", None) or "",
                "Links": getattr(rw, "Links", None) or "",
                "Morph": getattr(rw, "Morph", None) or "",
                "POS": getattr(rw, "POS", None) or "",
                "Phrase": getattr(rw, "Phrase", None) or "",
                "Grm": getattr(rw, "Grm", None) or "",
                "NER": getattr(rw, "NER", None) or "",
                "Semantic": getattr(rw, "Semantic", None) or "",
                "Lang_code": getattr(rw, "Lang_code", None) or "",
            })
        
        # Generate filename
        filename = get_export_filename("rowwords", format_type)
        
        # Export based on format
        if format_type == 'txt':
            content = export_to_txt(data)
            return StreamingResponse(
                io.StringIO(content),
                media_type="text/plain",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        elif format_type == 'csv':
            content = export_to_csv(data)
            return StreamingResponse(
                io.StringIO(content),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        elif format_type in ['xlsx', 'xls']:
            content = export_to_excel(data, format_type)
            return StreamingResponse(
                io.BytesIO(content),
                media_type=SUPPORTED_FORMATS[format_type],
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )

@router.get("/export/sentences",
    summary="Export Word Row Master Data",
    description="Export data from word_row_master (replaces sentences export). Requires authentication. Supports filtering by language.",
    response_description="Exported file in requested format"
)
async def export_sentences(
    format_type: str = Query(..., description="Export format: txt, csv, xlsx, or xls"),
    language: Optional[str] = Query(None, description="Filter by language"),
    source: Optional[str] = Query(None, description="Filter by source"),
    limit: Optional[int] = Query(1000, description="Maximum number of records to export"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng export / Please login to use export functionality",
                "requires_login": True,
                "login_url": "/auth/login"
            }
        )
    
    # Validate export format
    if not validate_export_format(format_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"Export format '{format_type}' not supported",
                "supported_formats": list(SUPPORTED_FORMATS.keys())
            }
        )
    
    try:
        # Build raw SQL to read from word_row_master
        sql = (
            "SELECT id, row_word_id, id_sen, word, lemma, links, morph, pos, phrase, grm, ner, semantic, lang_code, created_at, updated_at "
            "FROM word_row_master"
        )
        params: dict = {}
        where = []
        if language:
            where.append("lang_code = :lang_code")
            params["lang_code"] = language
        # 'source' not available on this table; ignore if provided
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY id LIMIT :limit"
        params["limit"] = int(limit or 1000)

        result = db.execute(text(sql), params)
        rows = result.mappings().all()

        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No data found matching the specified criteria"
            )
        
        # Convert to list of dictionaries
        data = []
        for r in rows:
            data.append({
                "ID": r.get("id"),
                "Row_Word_ID": r.get("row_word_id"),
                "ID_Sen": r.get("id_sen"),
                "Word": r.get("word"),
                "Lemma": r.get("lemma"),
                "Links": r.get("links"),
                "Morph": r.get("morph"),
                "POS": r.get("pos"),
                "Phrase": r.get("phrase"),
                "Grm": r.get("grm"),
                "NER": r.get("ner"),
                "Semantic": r.get("semantic"),
                "Lang_code": r.get("lang_code"),
                "Created_At": str(r.get("created_at") or ""),
                "Updated_At": str(r.get("updated_at") or ""),
            })
        
        # Generate filename
        filename = get_export_filename("word_row_master", format_type)
        
        # Export based on format
        if format_type == 'txt':
            content = export_to_txt(data)
            return StreamingResponse(
                io.StringIO(content),
                media_type="text/plain",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        elif format_type == 'csv':
            content = export_to_csv(data)
            return StreamingResponse(
                io.StringIO(content),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        elif format_type in ['xlsx', 'xls']:
            content = export_to_excel(data, format_type)
            return StreamingResponse(
                io.BytesIO(content),
                media_type=SUPPORTED_FORMATS[format_type],
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )

@router.get("/export/points",
    summary="Export Points Data",
    description="Export points data in specified format (TXT, CSV, or Excel). Requires authentication and supports filtering.",
    response_description="Exported file in requested format"
)
async def export_points(
    format_type: str = Query(..., description="Export format: txt, csv, xlsx, or xls"),
    limit: Optional[int] = Query(1000, description="Maximum number of records to export"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng export / Please login to use export functionality",
                "requires_login": True,
                "login_url": "/auth/login"
            }
        )
    
    # Validate export format
    if not validate_export_format(format_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"Export format '{format_type}' not supported",
                "supported_formats": list(SUPPORTED_FORMATS.keys())
            }
        )
    
    try:
        # Build query - Point table only has id, startpos, endpos
        query = db.query(Point)
        
        # Note: Point table doesn't have sentence_id column, so we can't filter by it
        # The sentence_id parameter is ignored for now since the table structure doesn't support it
        
        # Apply limit
        query = query.limit(limit)
        
        # Execute query
        points = query.all()
        
        if not points:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No data found matching the specified criteria"
            )
        
        # Convert to list of dictionaries - only use columns that actually exist
        data = []
        for point in points:
            data.append({
                "ID": point.id,
                "Start_Position": point.startpos,
                "End_Position": point.endpos
            })
        
        # Generate filename
        filename = get_export_filename("points", format_type)
        
        # Export based on format
        if format_type == 'txt':
            content = export_to_txt(data)
            return StreamingResponse(
                io.StringIO(content),
                media_type="text/plain",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        elif format_type == 'csv':
            content = export_to_csv(data)
            return StreamingResponse(
                io.StringIO(content),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        elif format_type in ['xlsx', 'xls']:
            content = export_to_excel(data, format_type)
            return StreamingResponse(
                io.BytesIO(content),
                media_type=SUPPORTED_FORMATS[format_type],
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )

@router.get("/export/status",
    summary="Get Export Status",
    description="Retrieve the current export status and available features. Returns different information based on authentication status.",
    response_description="Export status and available features"
)
async def get_export_status(
    db: Session = Depends(get_db)
):
    return {
        "authenticated": False,
        "message": "Export API Status - No authentication required for status check",
        "requires_login": False,
        "available_features": [
            "export_rowwords",
            "export_sentences", 
            "export_points",
            "view_status",
            "filter_data"
        ],
        "supported_formats": list(SUPPORTED_FORMATS.keys()),
        "export_options": {
            "rowwords": {
                "filters": ["language", "pos_tag"],
                "description": "Export word-level data with linguistic annotations"
            },
            "sentences": {
                "filters": ["language", "source"],
                "description": "Export sentence-level data with metadata"
            },
            "points": {
                "filters": ["sentence_id"],
                "description": "Export annotation points and markers"
            }
        },
        "format_details": {
            "txt": "Tab-separated values, suitable for text processing",
            "csv": "Comma-separated values, compatible with spreadsheet applications",
            "xlsx": "Modern Excel format, supports multiple sheets and formatting",
            "xls": "Legacy Excel format, compatible with older versions"
        }
    }
