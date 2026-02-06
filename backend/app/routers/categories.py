from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user_id, get_db_with_rls
from app.models.prompt import Prompt
from app.schemas.prompt import CategoriesResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=CategoriesResponse)
async def list_categories(
    q: str | None = Query(default=None, description="Prefix filter for categories"),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_with_rls),
) -> CategoriesResponse:
    """Get user's unique categories sorted by usage frequency.

    - Returns categories from user's prompts
    - Optional prefix filter via `q` parameter
    - Sorted by usage frequency (most used first)
    - Limited to 50 categories
    """
    # Count prompts per category - explicitly scoped to user
    count_col = func.count().label("cnt")
    query = (
        select(Prompt.category, count_col)
        .where(Prompt.category.isnot(None), Prompt.user_id == user_id)
        .group_by(Prompt.category)
    )

    # Apply prefix filter if provided
    if q:
        query = query.where(Prompt.category.ilike(f"{q}%"))

    # Order by frequency (most used first) and limit to 50
    query = query.order_by(desc(count_col)).limit(50)

    result = await db.execute(query)
    rows = result.all()

    return CategoriesResponse(categories=[row.category for row in rows])
