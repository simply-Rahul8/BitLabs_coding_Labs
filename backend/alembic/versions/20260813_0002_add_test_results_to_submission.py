"""add test_results to submission

Revision ID: 20260813_0002
Revises: 20260813_0001
Create Date: 2026-08-13 14:30:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260813_0002"
down_revision: Union[str, Sequence[str], None] = "20260813_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("candidate_submissions", sa.Column("test_results", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("candidate_submissions", "test_results")
