from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import io
import os
from database import get_db
from auth import get_current_user
from models.user import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.txt', '.csv', '.xlsx', '.xls'}

def validate_file_extension(filename: str) -> bool:
    """Validate if file extension is allowed"""
    if not filename:
        return False
    file_ext = os.path.splitext(filename.lower())[1]
    return file_ext in ALLOWED_EXTENSIONS

def validate_txt_format(content: str) -> tuple[bool, str]:
    """Validate TXT file format - should have 10 tab-separated columns"""
    if not content.strip():
        return False, "File is empty"
    
    lines = content.strip().split('\n')
    if not lines:
        return False, "File is empty"
    
    # Check first few lines to validate format
    for i, line in enumerate(lines[:10]):  # Check first 10 lines
        if not line.strip():
            continue
        
        columns = line.split('\t')
        if len(columns) != 10:
            return False, f"Line {i+1}: Expected 10 columns, got {len(columns)}"
        
        # Validate first column format (should be like VD00000101 or ED00000101)
        if not columns[0].strip():
            return False, f"Line {i+1}: First column (ID) cannot be empty"
        
        # Validate position column (should be numeric or comma-separated numbers)
        if columns[3].strip() != '-' and not columns[3].strip().replace(',', '').replace('.', '').isdigit():
            return False, f"Line {i+1}: Position column should be numeric or comma-separated numbers"
    
    return True, "Format is valid"

def validate_csv_format(content: str) -> tuple[bool, str]:
    """Validate CSV file format - should have 10 comma-separated columns"""
    if not content.strip():
        return False, "File is empty"
    
    try:
        # Try to parse as CSV
        df = pd.read_csv(io.StringIO(content), header=None)
        
        if df.empty:
            return False, "File is empty"
        
        if df.shape[1] != 10:
            return False, f"Expected 10 columns, got {df.shape[1]}"
        
        # Validate first few rows (skip header row if it exists)
        start_row = 0
        # Check if first row looks like a header (contains non-numeric values in position column)
        if len(df) > 0 and pd.notna(df.iloc[0, 3]):
            first_pos = str(df.iloc[0, 3]).strip()
            if not first_pos.replace(',', '').replace('.', '').isdigit():
                start_row = 1  # Skip header row
        
        for i in range(start_row, min(start_row + 10, len(df))):
            row = df.iloc[i]
            if pd.isna(row[0]) or str(row[0]).strip() == '':
                return False, f"Row {i+1}: First column (ID) cannot be empty"
            
            # Validate position column (4th column, index 3)
            if pd.notna(row[3]) and str(row[3]).strip() != '-':
                pos_str = str(row[3]).strip()
                # Remove any whitespace and check if it's numeric
                clean_pos = pos_str.replace(',', '').replace('.', '').strip()
                if not clean_pos.isdigit():
                    return False, f"Row {i+1}: Position column should be numeric or comma-separated numbers"
        
        return True, "Format is valid"
        
    except Exception as e:
        return False, f"Invalid CSV format: {str(e)}"

def validate_excel_format(content: bytes, file_extension: str) -> tuple[bool, str]:
    """Validate Excel file format - should have 10 columns"""
    try:
        if file_extension == '.xlsx':
            df = pd.read_excel(io.BytesIO(content), header=None, engine='openpyxl')
        else:  # .xls
            df = pd.read_excel(io.BytesIO(content), header=None, engine='xlrd')
        
        if df.empty:
            return False, "File is empty"
        
        if df.shape[1] != 10:
            return False, f"Expected 10 columns, got {df.shape[1]}"
        
        # Validate first few rows (skip header row if it exists)
        start_row = 0
        # Check if first row looks like a header (contains non-numeric values in position column)
        if len(df) > 0 and pd.notna(df.iloc[0, 3]):
            first_pos = str(df.iloc[0, 3]).strip()
            if not first_pos.replace(',', '').replace('.', '').isdigit():
                start_row = 1  # Skip header row
        
        for i in range(start_row, min(start_row + 10, len(df))):
            row = df.iloc[i]
            if pd.isna(row[0]) or str(row[0]).strip() == '':
                return False, f"Row {i+1}: First column (ID) cannot be empty"
            
            # Validate position column (4th column, index 3)
            if pd.notna(row[3]) and str(row[3]).strip() != '-':
                pos_str = str(row[3]).strip()
                # Remove any whitespace and check if it's numeric
                clean_pos = pos_str.replace(',', '').replace('.', '').strip()
                if not clean_pos.isdigit():
                    return False, f"Row {i+1}: Position column should be numeric or comma-separated numbers"
        
        return True, "Format is valid"
        
    except Exception as e:
        return False, f"Invalid Excel format: {str(e)}"

def validate_file_content(file: UploadFile) -> tuple[bool, str]:
    """Validate file content based on file type"""
    try:
        content = file.file.read()
        file.file.seek(0)  # Reset file pointer
        
        if not content:
            return False, "File is empty"
        
        file_ext = os.path.splitext(file.filename.lower())[1]
        
        if file_ext == '.txt':
            # For TXT files, decode content and validate
            try:
                text_content = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text_content = content.decode('latin-1')
                except UnicodeDecodeError:
                    return False, "Cannot decode file content - unsupported encoding"
            
            return validate_txt_format(text_content)
            
        elif file_ext == '.csv':
            # For CSV files, decode and validate
            try:
                text_content = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text_content = content.decode('latin-1')
                except UnicodeDecodeError:
                    return False, "Cannot decode file content - unsupported encoding"
            
            return validate_csv_format(text_content)
            
        elif file_ext in ['.xlsx', '.xls']:
            # For Excel files, validate binary content
            return validate_excel_format(content, file_ext)
            
        else:
            return False, f"Unsupported file type: {file_ext}"
            
    except Exception as e:
        return False, f"Error reading file: {str(e)}"

@router.get("/import/check-auth", 
    summary="Check Import Authentication",
    description="Verify if the current user is authenticated to use import functionality. Returns user information if authenticated, otherwise returns a login requirement message.",
    response_description="Authentication status and user information"
)
async def check_import_auth(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng import / Please login to use import functionality",
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

@router.post("/import/upload",
    summary="Upload/Import Data",
    description="Upload and import data files. Supports TXT, CSV, and Excel files with specific format validation. Returns 402 for empty files or wrong format.",
    response_description="Import operation status and validation results"
)
async def import_data(
    file: UploadFile = File(..., description="File to upload (TXT, CSV, or Excel)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Vui lòng đăng nhập để sử dụng tính năng import / Please login to use import functionality",
                "requires_login": True,
                "login_url": "/auth/login"
            }
        )
    
    # Validate file extension
    if not validate_file_extension(file.filename):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "File type not supported. Only TXT, CSV, and Excel files are allowed.",
                "supported_formats": list(ALLOWED_EXTENSIONS),
                "received_file": file.filename
            }
        )
    
    # Validate file content
    is_valid, validation_message = validate_file_content(file)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": f"File format validation failed: {validation_message}",
                "file_name": file.filename,
                "file_size": len(file.file.read()) if file.file else 0
            }
        )
    
    # TODO: Implement actual import logic here
    return {
        "message": "File validation successful - ready for import",
        "file_name": file.filename,
        "file_size": len(file.file.read()) if file.file else 0,
        "validation_status": "passed",
        "user_id": current_user.id,
        "user_email": current_user.email,
        "status": "validated"
    }

@router.get("/import/status",
    summary="Get Import Status",
    description="Retrieve the current import status and available features. Returns different information based on authentication status. If not authenticated, shows login requirements.",
    response_description="Import status and available features"
)
async def get_import_status(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {
            "authenticated": False,
            "message": "Vui lòng đăng nhập để xem trạng thái import / Please login to view import status",
            "requires_login": True,
            "login_url": "/auth/login",
            "available_features": []
        }
    
    return {
        "authenticated": True,
        "message": "Đã đăng nhập thành công / Successfully authenticated",
        "requires_login": False,
        "user_info": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value if current_user.role else None
        },
        "available_features": [
            "upload_files",
            "import_data",
            "view_status",
            "manage_imports"
        ],
        "supported_file_types": list(ALLOWED_EXTENSIONS),
        "file_format_requirements": {
            "columns": 10,
            "separator": "tab for TXT, comma for CSV, Excel format for Excel files",
            "required_columns": [
                "ID (e.g., VD00000101, ED00000101)",
                "Word/Token",
                "Pronunciation",
                "Position (numeric or comma-separated)",
                "POS Tag",
                "Additional info 1",
                "Additional info 2", 
                "Additional info 3",
                "Additional info 4",
                "Additional info 5"
            ]
        }
    }
