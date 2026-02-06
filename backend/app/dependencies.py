"""Application dependencies for FastAPI."""
from uuid import UUID

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db import get_db
from app.models.user import User


async def get_current_user_id(
    access_token: str | None = Cookie(default=None),
    settings: Settings = Depends(get_settings),
) -> UUID:
    """
    Extract and validate user_id from JWT token in cookie.

    Returns the user_id if token is valid.
    Raises 401 if token is missing or invalid.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(
            access_token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id_str = payload.get("user_id")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return UUID(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


async def get_current_user(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get the current authenticated user from the database.

    Returns the User object if found.
    Raises 401 if user doesn't exist in database.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_db_with_rls(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> AsyncSession:
    """
    Get database session with RLS context set.

    Sets the PostgreSQL session variable app.current_user_id
    for Row-Level Security policies.
    """
    await db.execute(
        text("SELECT set_config('app.current_user_id', :user_id, false)"),
        {"user_id": str(user_id)},
    )
    return db
