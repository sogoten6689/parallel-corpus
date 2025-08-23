from sqlalchemy import func
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from models.master_row_word import MasterRowWord
from database import get_db
from responses.row_word_list_response import RowWordListResponse
from schemas import RowWordCreate, RowWordRead
from crud import create_row_word, get_all_row_words
from models import RowWord
import pandas as pd
import io
from collections import defaultdict

router = APIRouter()

# @router.post("/word", response_model=RowWordRead)


def create(word: RowWordCreate, db: Session = Depends(get_db)):
    return create_row_word(db, word)


@router.get("/words")
def get_all(db: Session = Depends(get_db), response_model=RowWordListResponse, lang_code: str = '', search: str = '', page: int = 1, limit: int = 10):
    query = db.query(RowWord)

    if lang_code != '':
        query = query.filter(RowWord.Lang_code == lang_code)

    if search != '':
        query = query.filter(RowWord.Word.contains(search))

    total = query.count()
    total_pages = (total + limit - 1) // limit

    data = query.offset((page - 1) * limit).limit(limit).all()

    return {"data": data, "page": page, "limit": limit, "total": total, "total_pages": total_pages}

    # return get_all_row_words(db)


@router.get("/search-word")
async def search_word(
    key: str,
    isMorph: bool = False,
    lang_code: str = "vi",
    db: Session = Depends(get_db)
):
    # Normalize key similar to frontend
    norm_key = (key or "").strip().replace(" ", "_")
    key_lower = norm_key.lower()

    # Build base query
    query = db.query(MasterRowWord)
    # if lang_code:
    #     query = query.filter(MasterRowWord.lang_code == lang_code)

    if not isMorph:
        query = query.filter(MasterRowWord.word == norm_key)
    else:
        # Case-insensitive compare for Morph
        query = query.filter(func.lower(MasterRowWord.morph) == key_lower)

    # Order to keep deterministic first-per-sentence selection
    rows = query.order_by(MasterRowWord.id_sen, MasterRowWord.id).all()

    # return rows
    result = {}

    def serialize_row(r: MasterRowWord):
        return {
            "ID": getattr(r, "id_string", None),
            "ID_sen": getattr(r, "id_sen", None),
            "Word": getattr(r, "word", None),
            "Lemma": getattr(r, "lemma", None),
            "Links": getattr(r, "links", None),
            "Morph": getattr(r, "morph", None),
            "POS": getattr(r, "pos", None),
            "Phrase": getattr(r, "phrase", None),
            "Grm": getattr(r, "grm", None),
            "NER": getattr(r, "ner", None),
            "Semantic": getattr(r, "semantic", None),
            "Lang_code": getattr(r, "lang_code", None),
        }

    for r in rows:
        sid = getattr(r, "id_sen", None)
        if sid is None:
            continue
        if sid not in result:
            result[sid] = serialize_row(r)

    return result


@router.get("/search-phrase")
async def search_phrase(
    key: str,
    lang_code: str = "",
    db: Session = Depends(get_db)
):
    """
    Replicates the frontend searchPhrase behavior:
    - Build phrase variants from the input key (createPharse logic).
    - For each sentence, find the first contiguous match (case-insensitive).
    - Return a mapping: ID_sen -> list[RowWord] (the matched slice), 1 match per sentence.
    """
    norm_key = (key or "").strip()
    if not norm_key:
        return {}

    def create_phrases(src: str):
        words = src.split(" ")
        result_list = []
        seen = set()
        if len(words) >= 2:
            for num_word in range(2, 5):  # 2..4
                for k in range(len(words)):
                    temp = []
                    # prefix words
                    for h in range(0, k):
                        temp.append(words[h])
                    # group by num_word
                    i = k
                    while i < len(words) - num_word + 1:
                        phrase = " ".join(words[i:i + num_word]).strip()
                        temp.append(phrase)
                        i += num_word
                    # trailing remainder
                    while i < len(words):
                        temp.append(words[i])
                        i += 1
                    # append unique items to global list (approx of containsSublistUnordered)
                    for t in temp:
                        if t and t not in seen:
                            seen.add(t)
                            result_list.append(t)
        else:
            result_list.append(src)
        return result_list

    phrases = create_phrases(norm_key)

    # Fetch and group rows by sentence to avoid cross-sentence matches
    query = db.query(RowWord)
    if lang_code:
        query = query.filter(RowWord.Lang_code == lang_code)
    rows = query.order_by(RowWord.ID_sen, RowWord.ID).all()

    sentences = defaultdict(list)
    for r in rows:
        sentences[getattr(r, "ID_sen", None)].append(r)

    def serialize_row(r: RowWord):
        return {
            "ID": getattr(r, "ID", None),
            "ID_sen": getattr(r, "ID_sen", None),
            "Word": getattr(r, "Word", None),
            "Lemma": getattr(r, "Lemma", None),
            "Links": getattr(r, "Links", None),
            "Morph": getattr(r, "Morph", None),
            "POS": getattr(r, "POS", None),
            "Phrase": getattr(r, "Phrase", None),
            "Grm": getattr(r, "Grm", None),
            "NER": getattr(r, "NER", None),
            "Semantic": getattr(r, "Semantic", None),
            "Lang_code": getattr(r, "Lang_code", None),
        }

    result = {}
    for sid, sent_rows in sentences.items():
        if not sid or not sent_rows:
            continue
        matched = False
        for phrase in phrases:
            pw = phrase.split(" ")
            plen = len(pw)
            # slide window within the sentence
            for i in range(0, max(0, len(sent_rows) - plen + 1)):
                ok = True
                for j in range(plen):
                    if (getattr(sent_rows[i + j], "Word", "") or "").lower() != pw[j].lower():
                        ok = False
                        break
                if ok:
                    result[sid] = [serialize_row(x)
                                   for x in sent_rows[i:i + plen]]
                    matched = True
                    break
            if matched:
                break

    return result


@router.post("/import-rowwords/")
async def import_row_words(
    file: UploadFile = File(...),
    lang_code: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        lines = content.decode('utf-8').splitlines()

        rowwords_by_sentence = defaultdict(list)
        count = 0

        for line in lines:
            fields = line.strip().split('\t')
            if len(fields) != 10:
                continue  # skip malformed lines
            ID = fields[0]
            ID_sen = ID[2:-2]
            row = RowWord(
                ID=fields[0],
                Word=fields[1],
                Lemma=fields[2],
                ID_sen=ID_sen,
                Links=fields[4],
                POS=fields[5],
                Phrase=fields[6],
                Grm=fields[7],
                NER=fields[8],
                Semantic=fields[9],
                Lang_code=lang_code
            )
            rowwords_by_sentence[row.ID_sen].append(row)

            db.merge(row)  # upsert RowWord
            count += 1

        # Tạo Sentence + Point sau khi đã gom nhóm theo câu
        # for id_sen, rowwords in rowwords_by_sentence.items():
        #     # Tạo Sentence nếu chưa có
        #     sentence_exists = db.query(Sentence).filter_by(id_sen=id_sen).first()
        #     if not sentence_exists:
        #         sentence = Sentence(
        #             id_sen=id_sen,
        #             left="",
        #             center=" ".join([rw.Word for rw in rowwords]),
        #             right=""
        #         )
        #         db.add(sentence)

            # Tạo Point (startpos=0, endpos=N-1)
            # point_exists = db.query(Point).filter_by(sentence_id=id_sen).first()
            # if not point_exists:
            #     point = Point(
            #         sentence_id=id_sen,
            #         startpos=0,
            #         endpos=len(rowwords) - 1
            #     )
            #     db.add(point)

        db.commit()
        return {
            "message": f"Imported {count} row words from file.",
            "sentences": len(rowwords_by_sentence)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/sentences")
async def get_sentences(db: Session = Depends(get_db)):
    rows = db.query(RowWord).order_by(RowWord.ID_sen).all()
    rows_dict = [{"ID_sen": r.ID_sen} for r in rows]

    def build_sentence_map(rows):
        dicIdEng = {}
        if not rows:
            return dicIdEng

        idSen = rows[0]['ID_sen']
        start = 0

        for i in range(len(rows)):
            current_id = rows[i]['ID_sen']

            if current_id != idSen:
                dicIdEng[idSen] = {"start": start, "end": i - 1}
                idSen = current_id
                start = i
            elif i == len(rows) - 1:
                dicIdEng[idSen] = {"start": start, "end": i}

        return dicIdEng

    result = build_sentence_map(rows_dict)
    return result


@router.post("/import-corpus-file/")
async def import_corpus_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
            data = []
            for line in lines:
                if line.strip():  # Bỏ qua dòng trống
                    fields = line.strip().split('\t')
                    if len(fields) >= 11:  # Đảm bảo có đủ fields
                        data.append({
                            "ID": fields[0],
                            "ID_sen": fields[1],
                            "Word": fields[2],
                            "Lemma": fields[3],
                            "Links": fields[4],
                            "Morph": fields[5],
                            "POS": fields[6],
                            "Phrase": fields[7],
                            "Grm": fields[8],
                            "NER": fields[9],
                            "Semantic": fields[10] if len(fields) > 10 else ""
                        })
            df = pd.DataFrame(data)
        else:
            raise HTTPException(
                status_code=400, detail="File must be .csv, .xlsx, or .txt")

        # Kiểm tra cột cần thiết
        required_columns = ["ID", "ID_sen", "Word", "Lemma", "Links",
                            "Morph", "POS", "Phrase", "Grm", "NER", "Semantic"]
        missing = set(required_columns) - set(df.columns)
        if missing:
            raise HTTPException(
                status_code=422, detail=f"Missing columns: {', '.join(missing)}")

        # Thêm vào DB
        count = 0
        for _, row in df.iterrows():
            item = RowWord(
                ID=row["ID"],
                ID_sen=row["ID_sen"],
                Word=row["Word"],
                Lemma=row["Lemma"],
                Links=row["Links"],
                Morph=row["Morph"],
                POS=row["POS"],
                Phrase=row["Phrase"],
                Grm=row["Grm"],
                NER=row["NER"],
                Semantic=row["Semantic"],
            )
            db.merge(item)
            count += 1

        db.commit()
        return {"message": f"Imported {count} rows from {filename}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/export-rowwords-excel/")
def export_row_words_excel(db: Session = Depends(get_db)):
    # Lấy dữ liệu từ database
    rows = db.query(RowWord).all()

    # Convert sang pandas DataFrame
    data = [{
        "ID": r.ID,
        "ID_sen": r.ID_sen,
        "Word": r.Word,
        "Lemma": r.Lemma,
        "Links": r.Links,
        "Morph": r.Morph,
        "POS": r.POS,
        "Phrase": r.Phrase,
        "Grm": r.Grm,
        "NER": r.NER,
        "Semantic": r.Semantic
    } for r in rows]

    df = pd.DataFrame(data)

    # Ghi vào Excel file trong bộ nhớ
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="RowWords")

    output.seek(0)

    # Trả về file Excel để tải
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=row_words.xlsx"}
    )


@router.get("/sentence-pair")
def get_sentence_pair(
    id: str,
    lang_src: str,
    lang_tgt: str,
    db: Session = Depends(get_db),
):
    """
    Build source and target sentence views for a matched row.
    - id: RowWord.ID of the matched source row.
    - lang_src: language code for source side.
    - lang_tgt: language code for target side.

    Returns: { sentence_1: {ID_sen, Left, Center, Right}, sentence_2: {...} }
    """
    # Fetch the source row
    row = db.query(RowWord).filter(RowWord.ID == id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")

    id_sen = row.ID_sen

    # Fetch all rows in the same sentence for source and target
    src_rows = (
        db.query(RowWord)
        .filter(RowWord.ID_sen == id_sen, RowWord.Lang_code == lang_src)
        .order_by(RowWord.ID)
        .all()
    )
    tgt_rows = (
        db.query(RowWord)
        .filter(RowWord.ID_sen == id_sen, RowWord.Lang_code == lang_tgt)
        .order_by(RowWord.ID)
        .all()
    )

    # Build sentence 1 (source) using lexicographic ID comparison
    sentence_1 = {"ID_sen": id_sen, "Left": "", "Center": "", "Right": ""}
    for w in src_rows:
        if (w.ID or "") < (row.ID or ""):
            sentence_1["Left"] += f"{w.Word or ''} "
        elif (w.ID or "") > (row.ID or ""):
            sentence_1["Right"] += f"{w.Word or ''} "
        else:
            sentence_1["Center"] = w.Word or ""
    sentence_1["Left"] = sentence_1["Left"].strip()
    sentence_1["Center"] = sentence_1["Center"].strip()
    sentence_1["Right"] = sentence_1["Right"].strip()

    # Build sentence 2 (target) using Links numbers against target row IDs' last 2 digits
    sentence_2 = {"ID_sen": id_sen, "Left": "", "Center": "", "Right": ""}
    if (row.Links or "-") == "-":
        # No alignment; represent center as '-', right filled with last token per TS logic
        for r in tgt_rows:
            sentence_2["Left"] = ""
            sentence_2["Center"] = "-"
            sentence_2["Right"] = f"{(r.Word or '').strip()} "
        sentence_2["Right"] = sentence_2["Right"].strip()
    else:
        links = [s for s in (row.Links or "").split(",") if s]
        first_link = links[0].zfill(2) if links else ""
        last_link = links[-1].zfill(2) if links else ""
        for r in tgt_rows:
            num = (r.ID or "")[-2:]
            if num < first_link:
                sentence_2["Left"] += f"{r.Word or ''} "
            elif num > last_link:
                sentence_2["Right"] += f"{r.Word or ''} "
            else:
                sentence_2["Center"] += f"{r.Word or ''} "
        sentence_2["Left"] = sentence_2["Left"].strip()
        sentence_2["Center"] = sentence_2["Center"].strip()
        sentence_2["Right"] = sentence_2["Right"].strip()

    return {"sentence_1": sentence_1, "sentence_2": sentence_2}
