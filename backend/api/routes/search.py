"""
POST /search
Upload file .wav → trả top-5 giống nhất.
"""

import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from backend.search.retrieval import retrieve
from backend.api.schemas import SearchResponse

router = APIRouter()

UPLOAD_TMP = Path("/tmp/audio_uploads")
UPLOAD_TMP.mkdir(parents=True, exist_ok=True)


@router.post("/search", response_model=SearchResponse)
async def search_audio(
    file        : UploadFile = File(...),
    top_k       : int = Query(default=5, ge=1, le=20),
    filter_class: str = Query(default=None),
):
    """
    Upload file .wav → trả top-k âm thanh giống nhất.

    - **file**: file .wav cần tìm kiếm
    - **top_k**: số kết quả trả về (1-20, mặc định 5)
    - **filter_class**: lọc theo class (airplane/car/train/...)
    """
    # Validate file type
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file .wav")

    # Lưu file tạm
    tmp_path = UPLOAD_TMP / f"{uuid.uuid4().hex}.wav"
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        result = retrieve(
            filepath     = tmp_path,
            top_k        = top_k,
            filter_class = filter_class,
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Xóa file tạm sau khi xử lý
        if tmp_path.exists():
            tmp_path.unlink()