"""Prompts CRUD API endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user_id, get_db_with_rls
from app.models.prompt import Prompt
from app.schemas.prompt import (
    PromptCreate,
    PromptResponse,
    PromptsListResponse,
    PromptUpdate,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    prompt_data: PromptCreate,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_with_rls),
) -> PromptResponse:
    """Create a new prompt."""
    prompt = Prompt(
        user_id=user_id,
        title=prompt_data.title,
        content=prompt_data.content,
        category=prompt_data.category,
        tags=prompt_data.tags or [],
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return PromptResponse.model_validate(prompt)


@router.get("", response_model=PromptsListResponse)
async def list_prompts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, description="Full-text search query"),
    category: str | None = Query(default=None, description="Exact category filter"),
    tags: str | None = Query(
        default=None, description="Comma-separated tags filter (AND logic)"
    ),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_with_rls),
) -> PromptsListResponse:
    """List user's prompts with pagination, search, and filtering.

    - Search is weighted: title (A) > tags (B) > content (C)
    - Filters combine with AND logic
    - Results sorted by relevance when searching, by updated_at otherwise
    """
    # Build base query with filters - explicitly scoped to user
    base_query = select(Prompt).where(Prompt.user_id == user_id)
    count_query = select(func.count()).select_from(Prompt).where(Prompt.user_id == user_id)

    # Apply full-text search filter
    if q:
        # Convert search query to tsquery and filter by search_vector
        search_filter = Prompt.search_vector.op("@@")(
            func.plainto_tsquery("english", q)
        )
        base_query = base_query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Apply category filter (exact match)
    if category:
        base_query = base_query.where(Prompt.category == category)
        count_query = count_query.where(Prompt.category == category)

    # Apply tags filter (AND logic - all provided tags must be present)
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        if tag_list:
            # Use @> operator for array containment (all tags must be present)
            base_query = base_query.where(Prompt.tags.op("@>")(tag_list))
            count_query = count_query.where(Prompt.tags.op("@>")(tag_list))

    # Get total count with filters applied
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply ordering: by relevance when searching, by updated_at otherwise
    if q:
        # Order by text search rank (relevance) descending
        rank_expression = func.ts_rank(
            Prompt.search_vector, func.plainto_tsquery("english", q)
        )
        query = base_query.order_by(rank_expression.desc())
    else:
        query = base_query.order_by(Prompt.updated_at.desc())

    # Apply pagination
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    prompts = result.scalars().all()

    return PromptsListResponse(
        prompts=[PromptResponse.model_validate(p) for p in prompts],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_with_rls),
) -> PromptResponse:
    """Get a single prompt by ID."""
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id, Prompt.user_id == user_id)
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    return PromptResponse.model_validate(prompt)


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: UUID,
    prompt_data: PromptUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_with_rls),
) -> PromptResponse:
    """Update an existing prompt."""
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id, Prompt.user_id == user_id)
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    prompt.title = prompt_data.title
    prompt.content = prompt_data.content
    prompt.category = prompt_data.category
    prompt.tags = prompt_data.tags or []

    await db.commit()
    await db.refresh(prompt)
    return PromptResponse.model_validate(prompt)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_with_rls),
) -> None:
    """Delete a prompt."""
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id, Prompt.user_id == user_id)
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    await db.delete(prompt)
    await db.commit()
