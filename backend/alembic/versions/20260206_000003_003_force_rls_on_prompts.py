"""Force RLS on prompts table

Revision ID: 003
Revises: 002
Create Date: 2026-02-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Force RLS on prompts table so it applies even to the owner/superuser
    op.execute("ALTER TABLE prompts FORCE ROW LEVEL SECURITY;")


def downgrade() -> None:
    # Disable forced RLS
    op.execute("ALTER TABLE prompts NO FORCE ROW LEVEL SECURITY;")
