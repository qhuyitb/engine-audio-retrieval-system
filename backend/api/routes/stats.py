"""
GET /stats — thống kê dataset
GET /stats/collection — thông tin Qdrant collection
"""

from fastapi import APIRouter
from backend.db.reader     import get_stats
from backend.db.collection import get_collection_info
from backend.api.schemas   import StatsResponse

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
def dataset_stats():
    """Thống kê số file theo class — dùng cho trang Explorer."""
    return get_stats()


@router.get("/stats/collection")
def collection_stats():
    """Thông tin Qdrant collection — dùng để kiểm tra hệ thống."""
    return get_collection_info()