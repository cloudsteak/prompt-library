"""Database configuration and utilities."""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import get_settings

# Create async engine
engine = create_async_engine(
    get_settings().database_url,
    poolclass=NullPool,  # Recommended for async
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database sessions."""
    async with async_session_factory() as session:
        yield session


def get_sync_database_url() -> str:
    """Get synchronous database URL (for Alembic migrations)."""
    url = get_settings().database_url
    # Convert asyncpg URL to psycopg2 for sync operations
    return url.replace("postgresql+asyncpg://", "postgresql://")
