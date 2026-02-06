"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.db import engine
from app.routers.auth import router as google_auth_router
from app.routers.auth_general import router as auth_router
from app.routers.categories import router as categories_router
from app.routers.prompts import router as prompts_router
from app.routers.tags import router as tags_router

app = FastAPI(title="Prompt Library API")

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(google_auth_router)
app.include_router(categories_router)
app.include_router(prompts_router)
app.include_router(tags_router)


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker health checks."""
    db_status = "disconnected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception:
        pass

    return {"status": "healthy", "database": db_status}
