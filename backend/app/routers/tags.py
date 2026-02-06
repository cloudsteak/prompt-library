from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user_id, get_db_with_rls
from app.models.prompt import Prompt
from app.schemas.prompt import TagsResponse

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=TagsResponse)
async def list_tags(
    q: str | None = Query(default=None, description="Prefix filter for tags"),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_with_rls),
) -> TagsResponse:
    """Get user's unique tags sorted by usage frequency.

    - Returns tags from user's prompts
    - Optional prefix filter via `q` parameter
    - Sorted by usage frequency (most used first)
    - Limited to 20 tags
    """
    # Unnest the tags array to get individual tags from all user's prompts - explicitly scoped to user
    unnested = (
        select(func.unnest(Prompt.tags).label("tag"))
        .where(Prompt.user_id == user_id)
        .subquery()
    )

    # Count occurrences of each tag
    count_col = func.count().label("cnt")
    query = select(unnested.c.tag, count_col).group_by(unnested.c.tag)

    # Apply prefix filter if provided
    if q:
        query = query.where(unnested.c.tag.ilike(f"{q}%"))

    # Order by frequency (most used first) and limit to 20
    query = query.order_by(desc(count_col)).limit(20)

    result = await db.execute(query)
    rows = result.all()

    return TagsResponse(tags=[row.tag for row in rows])
