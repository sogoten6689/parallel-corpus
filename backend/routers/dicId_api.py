from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import RowWord

router = APIRouter()


@router.get("/dicid")
def get_dicid_by_lang(lang_code: str, db: Session = Depends(get_db)):
    """
    Return a dictionary mapping ID_sen -> { start: int, end: int }
    computed over all RowWord rows for the given lang_code.

    The indices are based on the order of rows sorted by (ID_sen, ID).
    """
    if not lang_code:
        raise HTTPException(status_code=400, detail="lang_code is required")

    rows = (
        db.query(RowWord)
        .filter(RowWord.Lang_code == lang_code)
        .order_by(RowWord.ID_sen, RowWord.ID)
        .all()
    )

    dic: dict[str, dict[str, int]] = {}
    if not rows:
        return dic

    current_id = rows[0].ID_sen
    start = 0
    for i, r in enumerate(rows):
        if r.ID_sen != current_id:
            dic[current_id] = {"start": start, "end": i - 1}
            current_id = r.ID_sen
            start = i
        elif i == len(rows) - 1:
            dic[current_id] = {"start": start, "end": i}

    return dic
