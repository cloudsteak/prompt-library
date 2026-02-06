"""General authentication endpoints."""
from datetime import datetime

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class UserProfile(BaseModel):
    """User profile response schema."""

    id: str
    email: str
    name: str | None
    picture_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/me", response_model=UserProfile)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserProfile:
    """Get the current authenticated user's profile."""
    return UserProfile(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        picture_url=current_user.picture_url,
        created_at=current_user.created_at,
    )


@router.post("/logout")
async def logout() -> Response:
    """Clear the authentication cookie."""
    response = Response(status_code=status.HTTP_200_OK)
    response.delete_cookie(key="access_token", path="/")
    return response
