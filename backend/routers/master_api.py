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
from sqlalchemy import func


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
                            "id_string": extract_main_id(fields[0]),
                            "id_sen": extract_sentence_id(fields[0]),
                            "word": fields[1],
                            "lemma": fields[2],
                            "links": fields[3],
                            "morph": fields[4],
                            "pos": fields[5],
                            "phrase": fields[6],
                            "grm": fields[7],
                            "ner": fields[8],
                            "semantic": fields[9] if len(fields) > 9 else ""
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
            if row["id_string"].strip() == "":
                continue
            item = MasterRowWord(
                id_string=row["id_string"],
                id_sen=row["id_sen"],
                word=row["word"],
                lemma=row["lemma"],
                links=row["links"],
                morph=row["morph"],
                pos=row["pos"],
                phrase=row["phrase"],
                grm=row["grm"],
                ner=row["ner"],
                semantic=row["semantic"],
                lang_code=lang_code
            )
            db.merge(item)
            count += 1

        db.commit()
        return {"message": f"Imported {count} rows from {filename}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    
@router.post("/import-validation")
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
                            "id_string": extract_main_id(fields[0]),
                            "id_sen": extract_sentence_id(fields[0]),
                            "word": fields[1],
                            "lemma": fields[2],
                            "links": fields[3],
                            "morph": fields[4],
                            "pos": fields[5],
                            "phrase": fields[6],
                            "grm": fields[7],
                            "ner": fields[8],
                            "semantic": fields[9] if len(fields) > 9 else ""
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
                id_string=row["id_string"],
                id_sen=row["id_sen"],
                word=row["word"],
                lemma=row["lemma"],
                links=row["links"],
                morph=row["morph"],
                pos=row["pos"],
                phrase=row["phrase"],
                grm=row["grm"],
                ner=row["ner"],
                semantic=row["semantic"],
                lang_code=lang_code
            )
            db.merge(item)
            count += 1

        db.rollback()
        return {"message": f"Validated {count} rows from {filename}"}

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
def get_dicid_by_lang(lang_code: str, other_lang_code: str, search: str = '', is_morph: bool = False, page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
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

        norm_key = (search or "").strip().replace(" ", "_")
        key_lower = norm_key.lower()
        

        if not is_morph:
            query = query.filter(MasterRowWord.word == norm_key)
        else:
            # Case-insensitive compare for Morph
            query = query.filter(func.lower(MasterRowWord.morph) == key_lower)

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
    # return rows_in_list_id_sen
    lang_code_dic = []
    other_lang_code_dic = []

    for row in rows:
        row_full = {
            "id_string": row.id_string,
            "id_sen": row.id_sen,
            "center": row.word,
            "position": extract_last_key_id(row.id_string),
        }
        rows_same_sen = [r for r in rows_in_list_id_sen if r.id_sen == row.id_sen and r.lang_code == lang_code]

        # row_position = extract_last_key_id(r.id_string)
        row_links = [s for s in (row.links or "").split(",") if s]
        row_start = row_links[0]
        row_end = row_links[row_links.__len__() - 1]
        new_dic = []
        for r in rows_same_sen:
            position = extract_last_key_id(r.id_string)
            links = [s for s in (r.links or "").split(",") if s]
            new_dic.append({
                "position": position,
                "word": r.word,
                "links_array": links,
                "links": r.links,
                "start": links[0],
                "end": links[links.__len__() - 1]
            })

        # row_full["new_dic"] = new_dic
        sentence_left = ""
        sentence_right = ""
        # sorted_same_sen = sorted(dic[row.id_string]["new_dic"], key=lambda x: extract_last_key_id(x["id_string"]))
        sorted_same_sen = sorted(new_dic, key=lambda x: x["position"])

        center_position = extract_last_key_id(row.id_string)
        for r in sorted_same_sen:
            if r['position'] < center_position:
                sentence_left += f"{r['word']} "
                # sentence_left += f"({r['position']} - {r['links']}) "
            if r['position'] > center_position:
                sentence_right += f"{r['word']} "
                # sentence_right += f"({r['position']} - {r['links']}) "
        
        row_full["left"] = sentence_left
        row_full["right"] = sentence_right

        lang_code_dic.append(row_full)


        other_lang_rows = [r for r in rows_in_list_id_sen if r.id_string == row.id_string and r.lang_code == other_lang_code]

        if other_lang_rows.__len__() == 0:
            continue

        other_lang_row = other_lang_rows[0]

        other_lang_row_full = {
            "id_string": row.id_string,
            "id_sen": row.id_sen,
            "start_center": row_start,
            "end_center": row_end,
            "center": other_lang_row.word,
            "position": extract_last_key_id(other_lang_row.id_string),
        }

        other_lang_rows_same_sen = [r for r in rows_in_list_id_sen if (r.id_sen == row.id_sen and r.lang_code == other_lang_code)]
        other_lang_new_dic = []
        for r in other_lang_rows_same_sen:
            position = extract_last_key_id(r.id_string)
            links = [s for s in (r.links or "").split(",") if s]
            other_lang_new_dic.append({
                "position": position,
                "word": r.word,
                "links": r.links,
                "links_array": links,
                "start": links[0],
                "end": links[links.__len__() - 1]
            })

        # row_full["new_dic"] = new_dic
        other_lang_sentence_left = ""
        other_lang_sentence_right = ""
        # sorted_same_sen = sorted(dic[row.id_string]["new_dic"], key=lambda x: extract_last_key_id(x["id_string"]))

        other_lang_sorted_same_sen = sorted(other_lang_new_dic, key=lambda x: x["position"])
        other_lang_center_position = extract_last_key_id(other_lang_row.id_string)
        other_center = ""
        other_postion = ""
        for r in other_lang_sorted_same_sen:
            if r['position'] < other_lang_center_position:
                other_lang_sentence_left += f"{r['word']} "
                # other_lang_sentence_left += f"({r['position']} - {r['links']}) "
            if r['position'] > other_lang_center_position:
                other_lang_sentence_right += f"{r['word']} "
                # other_lang_sentence_right += f"({r['position']} - {r['links']}) "


        # for r in other_lang_sorted_same_sen:
        #     if r['start'] < row_start and r['end'] > row_end:
        #         other_lang_sentence_left += f"{r['word']} "
        #     else :
        #         if r['start'] > row_start and r['end'] < row_end:
        #             other_lang_sentence_right += f"{r['word']} "
        #         else:
        #             other_center += f"{r['word']} "
        #             other_postion += f"{r['position']} "

        # other_lang_row_full["center"] = other_center
        # other_lang_row_full["position"] = other_postion
        other_lang_row_full["left"] = other_lang_sentence_left
        other_lang_row_full["right"] = other_lang_sentence_right

        other_lang_code_dic.append(other_lang_row_full)
   

   
    data = {}

    data[lang_code] = lang_code_dic
    data[other_lang_code] = other_lang_code_dic
        
    return {
        "data": data,
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

def extract_last_key_id(id_str: str) -> int:
    """
    Trích xuất 2 chữ số cuối từ chuỗi ID dạng xxxxxxYY
    Ví dụ: '01821301' -> 1
    Ví dụ: '00000201' -> 1
    """
    id_str = id_str.replace("\ufeff", "").strip()
    if len(id_str) >= 8:
        return int(id_str[-2:])
    raise ValueError(f"ID không hợp lệ: {id_str}")