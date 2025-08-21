from typing import ClassVar, List
from models.master_row_word import MasterRowWord

class MasterRowWordListResponse(MasterRowWord):
    total: ClassVar[int]
    page: ClassVar[int]
    total_pages: ClassVar[int]
    limit: ClassVar[int]
    data: List[MasterRowWord] = []