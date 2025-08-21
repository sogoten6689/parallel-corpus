from pydantic import BaseModel


class PointBase(BaseModel):
    # Align with backend/utils/data-utils.py PointView
    start: int
    end: int


class PointCreate(PointBase):
    pass


class PointRead(PointBase):
    id: int | None = None

    class Config:
        orm_mode = True
