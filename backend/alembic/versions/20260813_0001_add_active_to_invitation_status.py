"""add active to invitation_status enum

Revision ID: 20260813_0001
Revises: 20260811_0001
Create Date: 2026-08-13 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260813_0001"
down_revision: Union[str, Sequence[str], None] = "20260811_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'active' value to invitation_status enum
    op.execute("ALTER TYPE invitation_status ADD VALUE 'active'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values directly
    # You would need to recreate the type, which is complex
    # For now, we'll just pass
    pass
