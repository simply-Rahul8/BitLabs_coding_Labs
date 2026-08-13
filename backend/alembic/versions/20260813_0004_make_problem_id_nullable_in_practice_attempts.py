"""make problem_id nullable in practice_attempts

Revision ID: 20260813_0004
Revises: 20260813_0003
Create Date: 2026-08-13 15:15:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260813_0004"
down_revision: Union[str, Sequence[str], None] = "20260813_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("practice_attempts", "problem_id", existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column("practice_attempts", "problem_id", existing_type=sa.UUID(), nullable=False)
