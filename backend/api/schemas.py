"""
Pydantic schemas — định nghĩa shape của request/response.
"""

from pydantic import BaseModel
from typing import Optional


class SearchResultItem(BaseModel):
    rank        : int
    score       : float
    id          : int
    filename    : str
    class_label : str
    file_path   : str
    duration_sec: float


class SearchResponse(BaseModel):
    query  : dict
    steps  : list[dict]
    results: list[SearchResultItem]


class AudioInfo(BaseModel):
    id          : int
    filename    : str
    class_label : str
    file_path   : str
    duration_sec: float
    sample_rate : int
    created_at  : Optional[str] = None


class StatsResponse(BaseModel):
    total    : int
    by_class : dict[str, int]