"""add starter_code to questions

Revision ID: 20260813_0003
Revises: 20260813_0002
Create Date: 2026-08-13 14:45:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260813_0003"
down_revision: Union[str, Sequence[str], None] = "20260813_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("questions", sa.Column("starter_code", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("questions", "starter_code")
