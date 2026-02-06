"""Create prompts table with RLS and full-text search

Revision ID: 002
Revises: 001
Create Date: 2026-02-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, TSVECTOR

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create prompts table
    op.create_table(
        "prompts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("tags", ARRAY(sa.Text), nullable=True, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        # tsvector column for full-text search (will be populated by trigger)
        sa.Column("search_vector", TSVECTOR, nullable=True),
    )

    # Create index on user_id for query performance
    op.create_index("ix_prompts_user_id", "prompts", ["user_id"])

    # Create GIN index on search_vector for full-text search
    op.create_index(
        "ix_prompts_search_vector",
        "prompts",
        ["search_vector"],
        postgresql_using="gin"
    )

    # Create index on category for filtering
    op.create_index("ix_prompts_category", "prompts", ["category"])

    # Create GIN index on tags array for array containment queries
    op.create_index(
        "ix_prompts_tags",
        "prompts",
        ["tags"],
        postgresql_using="gin"
    )

    # Create function to update search_vector with weighted ranking
    # title (A - highest weight) > tags (B) > content (C - lowest weight)
    op.execute("""
        CREATE OR REPLACE FUNCTION prompts_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
                setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger to update search_vector on INSERT or UPDATE
    op.execute("""
        CREATE TRIGGER prompts_search_vector_trigger
        BEFORE INSERT OR UPDATE ON prompts
        FOR EACH ROW EXECUTE FUNCTION prompts_search_vector_update();
    """)

    # Enable Row-Level Security on prompts table
    op.execute("ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;")

    # Create RLS policy: users can only access their own prompts
    # The policy checks app.current_user_id session variable against user_id column
    op.execute("""
        CREATE POLICY prompts_user_isolation ON prompts
        FOR ALL
        USING (user_id = current_setting('app.current_user_id', true)::uuid)
        WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);
    """)

    # Create function to update updated_at timestamp
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger to auto-update updated_at on prompts
    op.execute("""
        CREATE TRIGGER prompts_updated_at_trigger
        BEFORE UPDATE ON prompts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS prompts_updated_at_trigger ON prompts;")
    op.execute("DROP TRIGGER IF EXISTS prompts_search_vector_trigger ON prompts;")

    # Drop functions
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    op.execute("DROP FUNCTION IF EXISTS prompts_search_vector_update();")

    # Drop RLS policy
    op.execute("DROP POLICY IF EXISTS prompts_user_isolation ON prompts;")

    # Disable RLS
    op.execute("ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;")

    # Drop indexes
    op.drop_index("ix_prompts_tags", table_name="prompts")
    op.drop_index("ix_prompts_category", table_name="prompts")
    op.drop_index("ix_prompts_search_vector", table_name="prompts")
    op.drop_index("ix_prompts_user_id", table_name="prompts")

    # Drop table
    op.drop_table("prompts")
