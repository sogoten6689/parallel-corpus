from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from crud import get_word_row_masters_by_lang
from models.master_row_word import MasterRowWord
from database import get_db
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from models import RowWord
import pandas as pd
import io
from auth import get_current_user
from models.user import User, UserRole
from typing import List, Optional
import re

from responses.master_row_word_list_response import MasterRowWordListResponse
from responses.row_word_list_response import RowWordListResponse
router = APIRouter(prefix="/master", tags=["master"])

@router.post("/import")
async def import_corpus_file(current_user: Optional[User] = Depends(get_current_user), file: UploadFile = File(...),
                             lang_code: str = Form(...), db: Session = Depends(get_db)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="No Permission. Only admin can import master data")
    if file is None:
        raise HTTPException(status_code=400, detail="No file uploaded")
    if lang_code is None:
        raise HTTPException(status_code=400, detail="Language code is required")
    try:
        # Đọc file content
        content = await file.read()
        filename = file.filename.lower()

        # Đọc file bằng Pandas hoặc xử lý text
        if filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(content.decode("utf-8")), sep=",")
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(content), engine='openpyxl')
        elif filename.endswith(".txt"):
            # Xử lý file .txt với format tab-separated
            lines = content.decode("utf-8").splitlines()
            # return lines
            data = []
            for line in lines:
                # return line
                if line.strip():  # Bỏ qua dòng trống
                    fields = line.strip().split('\t')
                    if len(fields) >= 9:  # Đảm bảo có đủ fields
                        data.append({
                            "ID": extract_main_id(fields[0]),
                            "ID_sen": extract_sentence_id(fields[0]),
                            "Word": fields[1],
                            "Lemma": fields[2],
                            "Links": fields[3],
                            "Morph": fields[4],
                            "POS": fields[5],
                            "Phrase": fields[6],
                            "Grm": fields[7],
                            "NER": fields[8],
                            "Semantic": fields[9] if len(fields) > 9 else ""
                        })
            df = pd.DataFrame(data)
        else:
            raise HTTPException(status_code=400, detail="File must be .csv, .xlsx, or .txt")

        # # Kiểm tra cột cần thiết
        # required_columns = ["ID", "ID_sen", "Word", "Lemma", "Links", "Morph", "POS", "Phrase", "Grm", "NER", "Semantic"]
        # missing = set(required_columns) - set(df.columns)
        # if missing:
        #     raise HTTPException(status_code=422, detail=f"Missing columns: {', '.join(missing)}")

        # Thêm vào DB
        count = 0
        for _, row in df.iterrows():
            if row["ID"].strip() == "":
                continue
            item = MasterRowWord(
                id_string=row["ID"],
                id_sen=row["ID_sen"],
                word=row["Word"],
                lemma=row["Lemma"],
                links=row["Links"],
                morph=row["Morph"],
                pos=row["POS"],
                phrase=row["Phrase"],
                grm=row["Grm"],
                ner=row["NER"],
                semantic=row["Semantic"],
                lang_code=lang_code
            )
            db.merge(item)
            count += 1

        db.commit()
        return {"message": f"Imported {count} rows from {filename}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    

@router.get("/words")
def get_all(db: Session = Depends(get_db), response_model=MasterRowWordListResponse,
            page: int = 1, limit: int = 10, lang_code: str = '', search: str = ''):
    query = db.query(MasterRowWord)

    if lang_code != '':
        query = query.filter(MasterRowWord.lang_code == lang_code)

    if search != '':
        query = query.filter(MasterRowWord.word.contains(search))

    total = query.count()
    total_pages = (total + limit - 1) // limit

    data = query.offset((page - 1) * limit).limit(limit).all()

    return {"data": data, "page": page, "limit": limit, "total": total, "total_pages": total_pages}



@router.get("/dicid")
def get_dicid_by_lang(lang_code: str, other_lang_code: str, search: str = '',page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """
    Return a dictionary mapping ID_sen -> { start: int, end: int }
    computed over all RowWord rows for the given lang_code.

    The indices are based on the order of rows sorted by (ID_sen, ID).
    """
    if not lang_code:
        raise HTTPException(status_code=400, detail="lang_code is required")

    query = db.query(MasterRowWord).filter(MasterRowWord.lang_code == lang_code)

    if search != '':  # Kiểm tra search khác rỗng
        query = query.filter(MasterRowWord.word.contains(search))

    rows = (
        query
        .order_by(MasterRowWord.id_sen, MasterRowWord.id)
        .offset((page - 1) * limit).limit(limit)
        .all()
    )
    list_id_sen = [row.id_sen for row in rows]

    rows_in_list_id_sen = (
        db.query(MasterRowWord)
        .filter(MasterRowWord.lang_code.in_([lang_code, other_lang_code]))
        .filter(MasterRowWord.id_sen.in_(list_id_sen))
        .order_by(MasterRowWord.id_sen, MasterRowWord.id)
        .all()
    )
    # merge rows
    dic: dict[str, dict[str, int]] = {}
    for row in rows:
        dic[row.id_string] = row

        

    # return rows
    # dic: dict[str, dict[str, int]] = {}
    # if not rows:
    #     return dic

    # rows_in_list_id_sen = (
    #     db.query(MasterRowWord)
    #     .filter(MasterRowWord.id_sen.in_(list_id_sen))
    #     .order_by(MasterRowWord.id_sen, MasterRowWord.id)
    #     .all()
    # )
    # current_id = rows[0].id_sen

    # start = 1
    # for i, r in enumerate(rows_in_list_id_sen):
    #     if r.id_sen != current_id:
    #         dic[current_id] = {"start": start, "end": i - 1}
    #         current_id = r.id_sen
    #         start = i
    #     elif i == len(rows) - 1:
    #         dic[current_id] = {"start": start, "end": i}

    return {
        # "rows_in_list_id_sen": rows_in_list_id_sen,
        "dic": dic,
        # "rows": rows,
        "sentences": list_id_sen,
        "metadata": {
            "lang_code": lang_code,
            "other_lang_code": other_lang_code,
            "page": page,
            "limit": limit,
            "total": len(rows),
            "total_pages": (len(rows) + limit - 1) // limit
        }
    }

def extract_sentence_id(id_str: str) -> str:
    """
    Trích xuất 6 chữ số chính từ chuỗi ID dạng VDxxxxxxYY
    Ví dụ: 'VD01821301' -> '018213'
    Ví dụ: 'ED00000201' -> '000002'
    """
    id_str = id_str.replace("\ufeff", "").strip()
    if len(id_str) >= 10 and (id_str.startswith("ED") or id_str.startswith("VD")):
        return id_str[2:-2]
    raise ValueError(f"ID không hợp lệ: {id_str}")
def extract_main_id(id_str: str) -> str:
    """
    Trích xuất 8 chữ số chính từ chuỗi ID dạng VDxxxxxxYY
    Ví dụ: 'VD01821301' -> '01821301'
    Ví dụ: 'ED00000201' -> '00000201'
    """
    id_str = id_str.replace("\ufeff", "").strip()
    if len(id_str) >= 10 and (id_str.startswith("ED") or id_str.startswith("VD") or id_str.startswith("KR")):
        return id_str[2:10]
    raise ValueError(f"ID không hợp lệ: {id_str}")