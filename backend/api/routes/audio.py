"""
GET /audio/{id}       — lấy thông tin 1 file theo id
GET /audio            — lấy danh sách (có filter class, phân trang)
DELETE /audio/{id}    — xóa 1 point khỏi Qdrant
"""

from fastapi import APIRouter, HTTPException, Query
from backend.db.reader import get_point, get_all_points, get_points_by_class
from backend.db.writer import delete_point
from backend.api.schemas import AudioInfo

router = APIRouter()


@router.get("/audio/{point_id}", response_model=AudioInfo)
def get_audio(point_id: int):
    """Lấy thông tin 1 file theo id."""
    result = get_point(point_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy id={point_id}")
    return result


@router.get("/audio", response_model=list[AudioInfo])
def list_audio(
    class_label: str = Query(default=None),
    limit      : int = Query(default=50, ge=1, le=200),
    offset     : int = Query(default=0, ge=0),
):
    """
    Lấy danh sách audio.
    - **class_label**: lọc theo class (tuỳ chọn)
    - **limit/offset**: phân trang
    """
    if class_label:
        points = get_points_by_class(class_label)
    else:
        points = get_all_points()

    return points[offset : offset + limit]


@router.delete("/audio/{point_id}")
def remove_audio(point_id: int):
    """Xóa 1 point khỏi Qdrant."""
    existing = get_point(point_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy id={point_id}")
    delete_point(point_id)
    return {"message": f"Đã xóa point id={point_id}"}


""" 
api reponsive file audio   Đức =>>
"""
from fastapi.responses import FileResponse
import os

@router.get("/audio/{point_id}/stream")
def stream_audio(point_id: int):
    result = get_point(point_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy id={point_id}")
    path = result["file_path"]
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File không tồn tại trên disk")
    return FileResponse(path, media_type="audio/wav")