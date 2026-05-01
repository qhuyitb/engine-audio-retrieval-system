"""
Entry point — chạy bằng:
    uvicorn backend.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.collection import init_collection
from backend.api import api_router

app = FastAPI(
    title       = "Engine Audio Retrieval API",
    description = "Tìm kiếm tiếng động cơ tương đồng",
    version     = "1.0.0",
)

# CORS cho Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

@app.on_event("startup")
async def startup():
    """Kiểm tra Qdrant collection khi khởi động."""
    init_collection(recreate=False)
    print("[API] Server ready.")


app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Engine Audio Retrieval API", "docs": "/docs"}