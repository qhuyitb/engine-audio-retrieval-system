# backend/api/__init__.py
from fastapi import APIRouter
from .routes.search import router as search_router
from .routes.audio  import router as audio_router
from .routes.stats  import router as stats_router

api_router = APIRouter()
api_router.include_router(search_router, tags=["Search"])
api_router.include_router(audio_router,  tags=["Audio"])
api_router.include_router(stats_router,  tags=["Stats"])