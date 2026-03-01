"""
Service layer for MasterRowWord using SQLAlchemy 2.x.

Assumptions:
- You already have a SQLAlchemy model named `MasterRowWord` imported from your models module.
- You pass a Session (sqlalchemy.orm.Session) into the service methods.
- Optional helper methods for pagination, grouping by id_sen, bulk ops, and safe commit.

Feel free to adjust field names in `create()` / `update()` according to your actual model.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from sqlalchemy import func, select, and_, or_, asc, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.master_row_word import MasterRowWord

# Import your model
# from app.models import MasterRowWord  # <- adjust this import to your project structure

# --- Utilities ---------------------------------------------------------------

BOM = "\ufeff"

def extract_main_id(id_str: str) -> str:
    """Extract core numeric ID from formats like 'VD01821301' -> '01821301'.
    - Removes BOM if present
    - Trims whitespace
    - Returns original if no pattern match; stays safe for downstream filters
    """
    if id_str is None:
        return ""
    s = id_str.replace(BOM, "").strip()
    # Keep last 8 digits if length >= 8
    digits = "".join(ch for ch in s if ch.isdigit())
    if len(digits) >= 8:
        return digits[-8:]
    return s

@dataclass
class PageParams:
    page: int = 1
    limit: int = 50

    def normalize(self) -> "PageParams":
        self.page = max(1, int(self.page or 1))
        self.limit = max(1, min(int(self.limit or 50), 2000))
        return self

@dataclass
class PageMeta:
    page: int
    limit: int
    total: int

    @property
    def total_pages(self) -> int:
        return (self.total + self.limit - 1) // self.limit

# --- Service ----------------------------------------------------------------

class MasterRowWordService:
    def __init__(self, model):
        self.model = model

    # ---------- Read / List -------------------------------------------------
    def get(self, db: Session, pk: Any) -> Optional["MasterRowWord"]:
        return db.get(self.model, pk)

    def list(
        self,
        db: Session,
        *,
        page: int = 1,
        limit: int = 50,
        search: Optional[str] = None,
        lang_codes: Optional[Sequence[str]] = None,
        id_sen_list: Optional[Sequence[str]] = None,
        order: Sequence[Tuple[str, str]] = (("id_sen", "asc"), ("id", "asc")),
    ) -> Tuple[List["MasterRowWord"], PageMeta]:
        """Flexible list with filters + pagination.

        Args:
            search: substring to match in `.word` (ILIKE %%...%%)
            lang_codes: filter `lang_code` IN (...)
            id_sen_list: filter `id_sen` IN (...)
            order: list of (column_name, 'asc'|'desc') pairs
        """
        pp = PageParams(page, limit).normalize()

        conditions = []
        if search:
            conditions.append(self.model.word.ilike(f"%{search}%"))
        if lang_codes:
            conditions.append(self.model.lang_code.in_(list(lang_codes)))
        if id_sen_list:
            # Clean potential BOMs and keep original ids as well, to be safe
            cleaned = [extract_main_id(x) for x in id_sen_list]
            conditions.append(or_(self.model.id_sen.in_(id_sen_list), self.model.id_sen.in_(cleaned)))

        stmt_base = select(self.model)
        if conditions:
            stmt_base = stmt_base.where(and_(*conditions))

        # Count
        total = db.execute(select(func.count()).select_from(stmt_base.subquery())).scalar_one()

        # Ordering
        order_exprs = []
        for col_name, dir_ in order:
            col = getattr(self.model, col_name)
            order_exprs.append(asc(col) if dir_.lower() == "asc" else desc(col))

        stmt = (
            stmt_base.order_by(*order_exprs)
            .offset((pp.page - 1) * pp.limit)
            .limit(pp.limit)
        )
        rows = list(db.execute(stmt).scalars())
        return rows, PageMeta(page=pp.page, limit=pp.limit, total=total)

    def list_all(
        self,
        db: Session,
        *,
        search: Optional[str] = None,
        lang_codes: Optional[Sequence[str]] = None,
        id_sen_list: Optional[Sequence[str]] = None,
        order: Sequence[Tuple[str, str]] = (("id_sen", "asc"), ("id", "asc")),
    ) -> List["MasterRowWord"]:
        rows, _ = self.list(
            db,
            page=1,
            limit=10_000_000,
            search=search,
            lang_codes=lang_codes,
            id_sen_list=id_sen_list,
            order=order,
        )
        return rows

    def group_by_id_sen(
        self,
        db: Session,
        *,
        lang_codes: Optional[Sequence[str]] = None,
        id_sen_list: Optional[Sequence[str]] = None,
        search: Optional[str] = None,
    ) -> Dict[str, List["MasterRowWord"]]:
        """Return a dictionary mapping id_sen -> [rows]."""
        rows = self.list_all(
            db,
            search=search,
            lang_codes=lang_codes,
            id_sen_list=id_sen_list,
        )
        grouped: Dict[str, List["MasterRowWord"]] = {}
        for r in rows:
            grouped.setdefault(r.id_sen, []).append(r)
        return grouped

    # ---------- Create / Update / Delete -----------------------------------
    def create(self, db: Session, data: Dict[str, Any]) -> "MasterRowWord":
        obj = self.model(**data)
        db.add(obj)
        self._commit(db)
        db.refresh(obj)
        return obj

    def bulk_create(self, db: Session, data_list: Iterable[Dict[str, Any]], *, chunk_size: int = 1000) -> int:
        """Insert many rows efficiently. Returns number of inserted records."""
        count = 0
        chunk: List[Dict[str, Any]] = []
        for item in data_list:
            chunk.append(item)
            if len(chunk) >= chunk_size:
                db.bulk_insert_mappings(self.model, chunk)
                self._commit(db)
                count += len(chunk)
                chunk.clear()
        if chunk:
            db.bulk_insert_mappings(self.model, chunk)
            self._commit(db)
            count += len(chunk)
        return count

    def update(self, db: Session, pk: Any, data: Dict[str, Any]) -> Optional["MasterRowWord"]:
        obj = self.get(db, pk)
        if not obj:
            return None
        for k, v in data.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        self._commit(db)
        db.refresh(obj)
        return obj

    def upsert_by_unique_keys(
        self,
        db: Session,
        data: Dict[str, Any],
        *,
        unique_keys: Sequence[str] = ("id_sen", "lang_code", "word"),
    ) -> "MasterRowWord":
        """Upsert based on a set of unique keys.
        Adjust `unique_keys` to your actual constraint.
        """
        conds = [getattr(self.model, k) == data.get(k) for k in unique_keys]
        stmt = select(self.model).where(and_(*conds)).limit(1)
        existing = db.execute(stmt).scalar_one_or_none()
        if existing:
            for k, v in data.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
            self._commit(db)
            db.refresh(existing)
            return existing
        obj = self.model(**data)
        db.add(obj)
        self._commit(db)
        db.refresh(obj)
        return obj

    def delete(self, db: Session, pk: Any) -> bool:
        obj = self.get(db, pk)
        if not obj:
            return False
        db.delete(obj)
        self._commit(db)
        return True

    def delete_by_id_sen(self, db: Session, id_sens: Sequence[str]) -> int:
        if not id_sens:
            return 0
        cleaned = [extract_main_id(x) for x in id_sens]
        stmt = select(self.model).where(or_(self.model.id_sen.in_(id_sens), self.model.id_sen.in_(cleaned)))
        rows = list(db.execute(stmt).scalars())
        for r in rows:
            db.delete(r)
        self._commit(db)
        return len(rows)
    

    def delete_all(self, db: Session) -> int:
        
        stmt = select(self.model)
        rows = list(db.execute(stmt).scalars())
        for r in rows:
            db.delete(r)
        self._commit(db)
        return len(rows)
    
    def delete_all_fast(self, db: Session, lang_code: str = "", lang_pair: str = "") -> int:
        query = db.query(self.model)
        if lang_code:
            query = query.filter(self.model.lang_code == lang_code)
        if lang_pair:
            query = query.filter(self.model.lang_pair == lang_pair)
        count = query.delete(synchronize_session=False)
        db.commit()
        return count

    # ---------- Counts ------------------------------------------------------
    def count(
        self,
        db: Session,
        *,
        search: Optional[str] = None,
        lang_codes: Optional[Sequence[str]] = None,
        id_sen_list: Optional[Sequence[str]] = None,
    ) -> int:
        conditions = []
        if search:
            conditions.append(self.model.word.ilike(f"%{search}%"))
        if lang_codes:
            conditions.append(self.model.lang_code.in_(list(lang_codes)))
        if id_sen_list:
            cleaned = [extract_main_id(x) for x in id_sen_list]
            conditions.append(or_(self.model.id_sen.in_(id_sen_list), self.model.id_sen.in_(cleaned)))
        stmt = select(func.count()).select_from(self.model)
        if conditions:
            stmt = stmt.where(and_(*conditions))
        return db.execute(stmt).scalar_one()

    # ---------- Internal helpers -------------------------------------------
    def _commit(self, db: Session) -> None:
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            raise e


# --- Example wiring (FastAPI) -----------------------------------------------
# from fastapi import Depends, APIRouter, Query
# from app.db import get_db
# from app.models import MasterRowWord
# from pydantic import BaseModel
#
# router = APIRouter(prefix="/master-row-words", tags=["master-row-words"])
# service = MasterRowWordService(MasterRowWord)
#
# class MRWCreate(BaseModel):
#     id_sen: str
#     lang_code: str
#     word: str
#     # add other fields here
#
# class MRWUpdate(BaseModel):
#     word: Optional[str] = None
#     # add other fields here
#
# @router.get("")
# def list_items(
#     page: int = Query(1, ge=1),
#    limit: int = Query(50, ge=1, le=2000),
#    search: Optional[str] = None,
#    lang_code: Optional[str] = None,
#    other_lang_code: Optional[str] = None,
#    id_sen: Optional[str] = None,
#    db: Session = Depends(get_db),
# ):
#    lang_codes = [x for x in [lang_code, other_lang_code] if x]
#    id_sen_list = [id_sen] if id_sen else None
#    rows, meta = service.list(
#        db,
#        page=page,
#        limit=limit,
#        search=search,
#        lang_codes=lang_codes or None,
#        id_sen_list=id_sen_list,
#    )
#    return {
#        "data": [
#            {
#                "id": r.id,
#                "id_sen": r.id_sen,
#                "lang_code": r.lang_code,
#                "word": r.word,
#            }
#            for r in rows
#        ],
#        "meta": {
#            "page": meta.page,
#            "limit": meta.limit,
#            "total": meta.total,
#            "total_pages": meta.total_pages,
#        },
#    }
#
# @router.post("")
# def create_item(payload: MRWCreate, db: Session = Depends(get_db)):
#    obj = service.create(db, payload.model_dump())
#    return {"id": obj.id}
#
# @router.patch("/{pk}")
# def update_item(pk: int, payload: MRWUpdate, db: Session = Depends(get_db)):
#    obj = service.update(db, pk, {k: v for k, v in payload.model_dump().items() if v is not None})
#    if not obj:
#        return {"ok": False, "message": "Not found"}
#    return {"ok": True}
#
# @router.delete("/{pk}")
# def delete_item(pk: int, db: Session = Depends(get_db)):
#    ok = service.delete(db, pk)
#    return {"ok": ok}
