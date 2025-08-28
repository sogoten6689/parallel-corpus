from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.master_row_word import MasterRowWord
from database import get_db
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import pandas as pd
import io
from auth import get_current_user
from models.user import User, UserRole
from typing import List, Optional
from sqlalchemy import distinct, func, or_


from responses.master_row_word_list_response import MasterRowWordListResponse
from responses.row_word_list_response import RowWordListResponse
from schemas.word_row_master import MasterRowWordUpdate
from services.master_row_word_service import MasterRowWordService

master_row_word_service = MasterRowWordService(MasterRowWord)

router = APIRouter(prefix="/master", tags=["master"])

@router.post("/import")
async def import_corpus_file(current_user: Optional[User] = Depends(get_current_user), file: UploadFile = File(...),
                             lang_code: str = Form(...), lang_pair: str = Form(...), db: Session = Depends(get_db), background_tasks: BackgroundTasks = BackgroundTasks()):
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

        background_tasks.add_task(process_file_job(content, filename, lang_code, lang_pair, db))

        return {"message": "File imported successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@router.get("/words")
def get_all(db: Session = Depends(get_db), response_model=MasterRowWordListResponse,
            page: int = 1, limit: int = 10, lang_code: str = '', search: str = ''):
    total_all = db.query(func.count(MasterRowWord.id)).scalar()
    total_all_sen = db.query(func.count(distinct(MasterRowWord.id_sen))).scalar()
    query = db.query(MasterRowWord)

    if lang_code != '':
        query = query.filter(MasterRowWord.lang_code == lang_code)

    if search != '':
        query = query.filter(
            or_(
                MasterRowWord.word.contains(search),
                MasterRowWord.id_sen.contains(search),
                MasterRowWord.id_string.contains(search)
            )
        )

    total = query.count()
    total_sen=query.distinct(MasterRowWord.id_sen).count()
    total_pages = (total + limit - 1) // limit

    data = query.order_by(MasterRowWord.id_sen, MasterRowWord.id).offset((page - 1) * limit).limit(limit).all()
    

    return {
        "data": data, 
        "page": page, 
        "limit": limit,
        "total": total,
        "total_all": total_all,
        "total_all_sen": total_all_sen,
        "total_sen": total_sen,
        "total_pages": total_pages,
    }


@router.get("/pos")
def get_all_pos(db: Session = Depends(get_db), lang_code: str = ""):
    # SELECT pos FROM master_row_words [WHERE lang_code=?] GROUP BY pos;
    query = db.query(distinct(MasterRowWord.pos))
    if lang_code:
        query = query.filter(MasterRowWord.lang_code == lang_code)
    rows = query.all()
    values = [r[0] for r in rows if r[0] is not None and str(r[0]).strip() != ""]
    values = sorted(values)
    return {"data": values}

@router.get("/ner")
def get_all_ner(db: Session = Depends(get_db), lang_code: str = ""):
    # SELECT ner FROM master_row_words [WHERE lang_code=?] GROUP BY ner;
    query = db.query(distinct(MasterRowWord.ner))
    if lang_code:
        query = query.filter(MasterRowWord.lang_code == lang_code)
    rows = query.all()
    values = [r[0] for r in rows if r[0] is not None and str(r[0]).strip() != ""]
    values = sorted(values)
    return {"data": values}

@router.get("/semantic")
def get_all_semantic(db: Session = Depends(get_db), lang_code: str = ""):
    # SELECT semantic FROM master_row_words [WHERE lang_code=?] GROUP BY semantic;
    query = db.query(distinct(MasterRowWord.semantic))
    if lang_code:
        query = query.filter(MasterRowWord.lang_code == lang_code)
    rows = query.all()
    values = [r[0] for r in rows if r[0] is not None and str(r[0]).strip() != ""]
    values = sorted(values)
    return {"data": values}

@router.put("/words/{id}")
def update_word(db: Session = Depends(get_db), response_model=MasterRowWordListResponse,
                current_user: Optional[User] = Depends(get_current_user), 
            id: int = 1,
            payload: MasterRowWordUpdate = MasterRowWordUpdate, 
            ):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="No Permission. Only admin can edit master data")
    db_word = db.query(MasterRowWord).filter(MasterRowWord.id == id).first()
    if not db_word:
        raise HTTPException(status_code=404, detail="Word not found - id: " + str(id))

    # Cập nhật các trường
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_word, key, value)

    db.commit()
    db.refresh(db_word)

    return {
        "message": "Updated successfully", 
        "data": db_word
    }


@router.delete("/words/delete-all")
def delete_all(db: Session = Depends(get_db)):
    master_row_word_service.delete_all_fast(db)
    return {"message": "All words deleted successfully"}

@router.get("/dicid")
def get_dicid_by_lang(lang_code: str, other_lang_code: str, lang_pair: str, search: str = '', is_morph: bool = False, is_phrase: bool = False, page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """
    Return a dictionary mapping ID_sen -> { start: int, end: int }
    computed over all RowWord rows for the given lang_code.

    The indices are based on the order of rows sorted by (ID_sen, ID).
    """
    if not lang_code:
        raise HTTPException(status_code=400, detail="lang_code is required")

    query = db.query(MasterRowWord).filter(MasterRowWord.lang_code == lang_code)
    query = query.filter(MasterRowWord.lang_pair == lang_pair)

    
    if search != '':  # Kiểm tra search khác rỗng
        # query = query.filter(MasterRowWord.word.contains(search))

        norm_key = (search or "").strip().replace(" ", "_")
        key_lower = norm_key.lower()
        
        if is_phrase:
            phrase_search = create_phrase2(search)
            query = query.filter(MasterRowWord.word.in_(phrase_search))

        if not is_morph:
            query = query.filter(MasterRowWord.word == norm_key)
        else:
            # Case-insensitive compare for Morph
            query = query.filter(func.lower(MasterRowWord.morph) == key_lower)
            
    total = query.count()
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
        .filter(MasterRowWord.lang_pair == lang_pair)
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

        sentence_left = ""
        sentence_right = ""
        sorted_same_sen = sorted(new_dic, key=lambda x: x["position"])

        center_position = extract_last_key_id(row.id_string)
        for r in sorted_same_sen:
            if r['position'] < center_position:
                sentence_left += f"{r['word']} "
            if r['position'] > center_position:
                sentence_right += f"{r['word']} "
        
        row_full["left"] = sentence_left
        row_full["right"] = sentence_right

        lang_code_dic.append(row_full)



        other_lang_row_full = {
            "id_string": row.id_string,
            "id_sen": row.id_sen,
            "start_center": row_start,
            "end_center": row_end,
            # "center": other_lang_row.word,
            # "position": extract_last_key_id(other_lang_row.id_string),
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

        other_lang_sentence_left = ""
        other_lang_sentence_right = ""
        other_lang_sorted_same_sen = sorted(other_lang_new_dic, key=lambda x: x["position"])

        if row.links == "-":
            other_lang_row_full["center"] = "-"
            for r in other_lang_sorted_same_sen:
                other_lang_sentence_right += f"{r['word']} "
        else:
            other_lang_sentence_center = ""
            for r in other_lang_sorted_same_sen:
                if r['position'] < int(row_start):
                    other_lang_sentence_left += f"{r['word']} "
                else :
                    if r['position'] > int(row_end):
                        other_lang_sentence_right += f"{r['word']} "
                    else :
                        other_lang_sentence_center += f"{r['word']} "
                        other_lang_row_full["center"] = other_lang_sentence_center
                        
            

        other_lang_row_full["left"] = other_lang_sentence_left
        other_lang_row_full["right"] = other_lang_sentence_right

        other_lang_code_dic.append(other_lang_row_full)
   
    data = {}

    data[lang_code] = lang_code_dic
    data[other_lang_code] = other_lang_code_dic
        
    return {
        "metadata": {
            "search": search,
            "lang_pair": lang_pair,
            "is_phrase": is_phrase,
            "is_morph": is_morph,
            "lang_code": lang_code,
            "other_lang_code": other_lang_code,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total/limit) // limit
        },
        "data": data,
    }

@router.get("/dicid-with-tag")
def get_dicid_by_lang_with_tag(
    lang_code: str, 
    other_lang_code: str, 
    lang_pair: str, 
    search: str = '', 
    is_morph: bool = False, 
    tag_type: str = '', 
    tag_value: str = '',
    page: int = 1, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    """
    Return a dictionary mapping ID_sen -> { start: int, end: int }
    computed over all RowWord rows for the given lang_code with tag filter.
    """
    if not lang_code:
        raise HTTPException(status_code=400, detail="lang_code is required")

    query = db.query(MasterRowWord).filter(MasterRowWord.lang_code == lang_code)
    query = query.filter(MasterRowWord.lang_pair == lang_pair)

    # Apply search filter
    if search != '':
        norm_key = (search or "").strip().replace(" ", "_")
        key_lower = norm_key.lower()
        
        if not is_morph:
            query = query.filter(MasterRowWord.word == norm_key)
        else:
            # Case-insensitive compare for Morph
            query = query.filter(func.lower(MasterRowWord.morph) == key_lower)
    
    # Apply tag filter
    if tag_type and tag_value:
        tag_value_lower = tag_value.lower()
        if tag_type == 'pos':
            query = query.filter(func.lower(MasterRowWord.pos) == tag_value_lower)
        elif tag_type == 'ner':
            query = query.filter(func.lower(MasterRowWord.ner) == tag_value_lower)
        elif tag_type == 'semantic':
            query = query.filter(func.lower(MasterRowWord.semantic) == tag_value_lower)
            
    total = query.count()
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
        .filter(MasterRowWord.lang_pair == lang_pair)
        .order_by(MasterRowWord.id_sen, MasterRowWord.id)
        .all()
    )
    
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

        sentence_left = ""
        sentence_right = ""
        sorted_same_sen = sorted(new_dic, key=lambda x: x["position"])

        center_position = extract_last_key_id(row.id_string)
        for r in sorted_same_sen:
            if r['position'] < center_position:
                sentence_left += f"{r['word']} "
            if r['position'] > center_position:
                sentence_right += f"{r['word']} "
        
        row_full["left"] = sentence_left
        row_full["right"] = sentence_right

        lang_code_dic.append(row_full)

        other_lang_row_full = {
            "id_string": row.id_string,
            "id_sen": row.id_sen,
            "start_center": row_start,
            "end_center": row_end,
            # "center": row.word,
            # "position": extract_last_key_id(row.id_string),
        }
        other_lang_rows_same_sen = [r for r in rows_in_list_id_sen if r.id_sen == row.id_sen and r.lang_code == other_lang_code]

        other_lang_new_dic = []
        for r in other_lang_rows_same_sen:
            position = extract_last_key_id(r.id_string)
            links = [s for s in (r.links or "").split(",") if s]
            other_lang_new_dic.append({
                "position": position,
                "word": r.word,
                "links_array": links,
                "links": r.links,
                "start": links[0],
                "end": links[links.__len__() - 1]
            })

        other_lang_sentence_left = ""
        other_lang_sentence_right = ""
        other_lang_sorted_same_sen = sorted(other_lang_new_dic, key=lambda x: x["position"])

        # other_lang_center_position = extract_last_key_id(row.id_string)
        # for r in other_lang_sorted_same_sen:
        #     if r['position'] < other_lang_center_position:
        #         other_lang_sentence_left += f"{r['word']} "
        #     if r['position'] > other_lang_center_position:
        #         other_lang_sentence_right += f"{r['word']} "
        
        if row.links == "-":
            other_lang_row_full["center"] = "-"
            for r in other_lang_sorted_same_sen:
                other_lang_sentence_right += f"{r['word']} "
        else:
            other_lang_sentence_center = ""
            for r in other_lang_sorted_same_sen:
                if r['position'] < int(row_start):
                    other_lang_sentence_left += f"{r['word']} "
                else :
                    if r['position'] > int(row_end):
                        other_lang_sentence_right += f"{r['word']} "
                    else :
                        other_lang_sentence_center += f"{r['word']} "
                        other_lang_row_full["center"] = other_lang_sentence_center

        other_lang_row_full["left"] = other_lang_sentence_left
        other_lang_row_full["right"] = other_lang_sentence_right

        other_lang_code_dic.append(other_lang_row_full)

    data = {}
    data[lang_code] = lang_code_dic
    data[other_lang_code] = other_lang_code_dic
        
    return {
        "metadata": {
            "search": search,
            "lang_pair": lang_pair,
            "is_morph": is_morph,
            "tag_type": tag_type,
            "tag_value": tag_value,
            "lang_code": lang_code,
            "other_lang_code": other_lang_code,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        },
        "data": data,
    }

@router.get("/align-sentence")
def get_align_sentence(db: Session = Depends(get_db), id_string: str = '', lang_code: str = 'en', other_lang_code: str = 'vi', lang_pair: str = 'vi_en'):

    if id_string == '':
        raise HTTPException(status_code=404, detail="Row not found - id_string is empty")
    
    row = db.query(MasterRowWord).filter(MasterRowWord.id_string == id_string)
    row = row.filter(MasterRowWord.lang_code == lang_code)
    row = row.filter(MasterRowWord.lang_pair == lang_pair)
    row = row.first()
    if not row:
        raise HTTPException(status_code=404, detail="Row not found - id_string not exist")


    rows_in_list_id_sen = (
        db.query(MasterRowWord)
        .filter(MasterRowWord.lang_code.in_([lang_code, other_lang_code]))
        .filter(MasterRowWord.lang_pair == lang_pair)
        .filter(MasterRowWord.id_sen == row.id_sen)
        .order_by(MasterRowWord.id_sen, MasterRowWord.id)
        .all()
    )
    rows_in_lang_code = [r for r in rows_in_list_id_sen if r.lang_code == lang_code]
    rows_in_other_lang_code = [r for r in rows_in_list_id_sen if r.lang_code == other_lang_code]

    new_dic_in_lang_code = []
    for r in rows_in_lang_code:
        position = extract_last_key_id(r.id_string)
        links = [s for s in (r.links or "").split(",") if s]
        new_dic_in_lang_code.append({
            "position": position,
            "word": r.word,
            "pos": r.pos,
            "links_array": links,
            "links": r.links,
            "start": links[0],
            "end": links[links.__len__() - 1]
        })

    new_dic_in_other_lang_code = []
    for r in rows_in_other_lang_code:
        position = extract_last_key_id(r.id_string)
        links = [s for s in (r.links or "").split(",") if s]
        new_dic_in_other_lang_code.append({
            "position": position,
            "word": r.word,
            "pos": r.pos,
            "links_array": links,
            "links": r.links,
            "start": links[0],
            "end": links[links.__len__() - 1]
        })

    new_dic_in_lang_code_sorted = sorted(new_dic_in_lang_code, key=lambda x: x["position"])
    new_dic_in_other_lang_code_sorted = sorted(new_dic_in_other_lang_code, key=lambda x: x["position"])

    sentence_1 = []
    sentence_2 = []

    idx = 0
    for row  in new_dic_in_lang_code_sorted:
        corpus = {
            "id": idx,
            "word": row["word"],
            # "position": row["position"],
            "pos": row["pos"],
            # "links": row["links"],
            # "links_array": row["links_array"],
            # "id_target": [int(x) - 1 for x in row["links_array"]],
            "id_target": [int(x) - 1 for x in row["links_array"]] if row["links"] != "-" else []
            # "start": row["start"],
            # "end": row["end"]
        }
        idx += 1
        sentence_1.append(corpus)

    # Build sentence_2
    idx = 0
    for row  in new_dic_in_other_lang_code_sorted:
        corpus = {
            "id": idx,
            "word": row["word"],
            # "position": row["position"],
            "pos": row["pos"],
            # "links": row["links"],
            # "links_array": row["links_array"],
            # "start": row["start"],
            # "end": row["end"]
        }
        idx += 1
        sentence_2.append(corpus)
            
    return {
        "sentence_1": sentence_1,
        "sentence_2": sentence_2
    }

def extract_sentence_id(id_str: str) -> str:
    """
    Trích xuất 6 chữ số chính từ chuỗi ID dạng VDxxxxxxYY
    Ví dụ: 'VD01821301' -> '018213'
    Ví dụ: 'ED00000201' -> '000002'
    """
    id_str = id_str.replace("\ufeff", "").strip()
    if len(id_str) >= 10:
        return id_str[2:-2]
    raise ValueError(f"ID không hợp lệ: {id_str}")
def extract_main_id(id_str: str) -> str:
    """
    Trích xuất 8 chữ số chính từ chuỗi ID dạng VDxxxxxxYY
    Ví dụ: 'VD01821301' -> '01821301'
    Ví dụ: 'ED00000201' -> '00000201'
    """
    id_str = id_str.replace("\ufeff", "").strip()
    # if len(id_str) >= 10 and (id_str.startswith("ED") or id_str.startswith("VD") or id_str.startswith("KR")):
    if len(id_str) >= 10:
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

def create_phrase(key: str) -> List[List[str]]:
    """
    Tách 1 phrase nhập vào thành các trường hợp có thể trong corpus.
    Ví dụ:
        "một con bò" -> [
            ["một", "con", "bò"],
            ["một_con", "bò"],
            ["một", "con_bò"],
            ["một_con_bò"]
        ]
        "một công ty" -> [
            ["một", "công_ty"]
        ]
    """
    phrases_list = []
    words = key.split(" ")

    if len(words) >= 2:
        num_word = 2
        while num_word <= 4:
            # Lướt qua từng vị trí trong danh sách từ
            for k in range(len(words)):
                temp = []

                # Thêm các từ đứng một mình trước vị trí k
                # for h in range(k):
                #     temp.append(words[h])

                # Tạo phrase với số từ bằng num_word bắt đầu từ vị trí k
                i = k
                while i < len(words) - num_word + 1:
                    phrase = "_".join(words[i:i + num_word])
                    temp.append(phrase)
                    i += num_word

                # Thêm các từ còn lại (không đủ tạo phrase)
                # while i < len(words):
                #     temp.append(words[i])
                #     i += 1

                # Tránh trùng lặp
                # if temp not in phrases_list:
                #     phrases_list.append(temp)

            num_word += 1
    else:
        phrases_list.append(words)

    return phrases_list


def create_phrase2(key: str) -> List[List[str]]:
    """
    Tách phrase nhập vào thành các trường hợp có thể khi chỉ ghép 2 từ.
    Ví dụ:
        "một con bò" -> [
            ["một", "con", "bò"],
            ["một_con", "bò"],
            ["một", "con_bò"]
        ]
    """
    phrases_list = []
    words = key.split(" ")

    if len(words) < 2:
        return [words]

    # Trường hợp gốc (không ghép gì)
    phrases_list.append(words)

    # Ghép từng cặp liền nhau
    for i in range(len(words) - 1):
        temp = words[:i] + [f"{words[i]}_{words[i+1]}"] + words[i+2:]
        if temp not in phrases_list:
            phrases_list.append(temp)

    merged = []
    for phrase_item in phrases_list:
        for word in phrase_item:
            if "_" in word and word not in merged:
                merged.append(word)

    return merged

def process_file_job(content: bytes, filename: str, lang_code: str, lang_pair: str, db: Session):
    try:
        count = 0
        data_db = []
        seen_ids = set()  # để kiểm tra trùng

        if filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(content.decode("utf-8")), sep=",")
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        elif filename.endswith(".txt"):
            lines = content.decode("utf-8").splitlines()
            for line in lines:
                if not line.strip():
                    continue
                fields = line.strip().split("\t")
                if len(fields) < 9 or not fields[0].strip():
                    continue

                id_string = extract_main_id(fields[0])
                id_sen = extract_sentence_id(fields[0])
                if id_string in seen_ids:
                    continue
                seen_ids.add(id_string)

                item = dict(
                    id_string=id_string,
                    id_sen=id_sen,
                    word=fields[1],
                    lemma=fields[2],
                    links=fields[3],
                    morph=fields[4],
                    pos=fields[5],
                    phrase=fields[6],
                    grm=fields[7],
                    ner=fields[8],
                    semantic=fields[9] if len(fields) > 9 else "",
                    lang_code=lang_code,
                    lang_pair=lang_pair
                )
                data_db.append(item)
                count += 1
        else:
            raise HTTPException(status_code=400, detail="File must be .csv, .xlsx, or .txt")

        # Bulk insert theo batch (mỗi batch 10k record)
        chunk_size = 5000
        for i in range(0, len(data_db), chunk_size):
            db.bulk_insert_mappings(MasterRowWord, data_db[i:i+chunk_size])
            db.commit()

        print(f"Imported {count} rows from {filename}")

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        db.rollback()
        raise
