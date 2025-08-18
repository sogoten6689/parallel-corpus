from typing import ClassVar, List
from models.rowword import RowWord

class RowWordListResponse(RowWord):
    total: ClassVar[int]
    page: ClassVar[int]
    total_pages: ClassVar[int]
    limit: ClassVar[int]
    data: List[RowWord] = []