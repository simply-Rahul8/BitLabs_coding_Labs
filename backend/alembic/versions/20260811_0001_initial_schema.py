"""initial schema

Revision ID: 20260811_0001
Revises:
Create Date: 2026-08-11 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260811_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = postgresql.ENUM("recruiter", "candidate", name="user_role", create_type=False)
    difficulty = postgresql.ENUM("easy", "medium", "hard", name="difficulty", create_type=False)
    invitation_status = postgresql.ENUM(
        "pending", "completed", "expired", name="invitation_status", create_type=False
    )
    practice_category = postgresql.ENUM(
        "arrays", "strings", "trees", "graphs", "dp", "sorting", "searching", "recursion", "hashing",
        name="practice_category", create_type=False,
    )
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    difficulty.create(bind, checkfirst=True)
    invitation_status.create(bind, checkfirst=True)
    practice_category.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recruiter_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("difficulty", difficulty, nullable=False),
        sa.Column("time_limit_mins", sa.Integer(), nullable=False),
        sa.Column("language_support", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["recruiter_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assessments_recruiter_id"), "assessments", ["recruiter_id"], unique=False)
    op.create_table(
        "practice_problems",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", practice_category, nullable=False),
        sa.Column("difficulty", difficulty, nullable=False),
        sa.Column("language_support", sa.JSON(), nullable=False),
        sa.Column("test_cases", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("problem_statement", sa.Text(), nullable=False),
        sa.Column("constraints", sa.Text(), nullable=False),
        sa.Column("examples", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_questions_assessment_id"), "questions", ["assessment_id"], unique=False)
    op.create_table(
        "assessment_invitations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("candidate_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("status", invitation_status, nullable=False),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"]),
        sa.ForeignKeyConstraint(["candidate_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index(op.f("ix_assessment_invitations_assessment_id"), "assessment_invitations", ["assessment_id"], unique=False)
    op.create_index(op.f("ix_assessment_invitations_candidate_id"), "assessment_invitations", ["candidate_id"], unique=False)
    op.create_index(op.f("ix_assessment_invitations_token"), "assessment_invitations", ["token"], unique=False)
    op.create_table(
        "test_cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("input", sa.Text(), nullable=False),
        sa.Column("expected_output", sa.Text(), nullable=False),
        sa.Column("is_hidden", sa.Boolean(), nullable=False),
        sa.Column("is_edge_case", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_test_cases_question_id"), "test_cases", ["question_id"], unique=False)
    op.create_table(
        "candidate_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invitation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_code", sa.Text(), nullable=False),
        sa.Column("language", sa.String(length=50), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["invitation_id"], ["assessment_invitations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_candidate_submissions_invitation_id"), "candidate_submissions", ["invitation_id"], unique=False)
    op.create_table(
        "ai_evaluations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("strengths", sa.Text(), nullable=False),
        sa.Column("weaknesses", sa.Text(), nullable=False),
        sa.Column("recommendations", sa.Text(), nullable=False),
        sa.Column("ai_score", sa.Float(), nullable=False),
        sa.Column("raw_response", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["candidate_submissions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("submission_id"),
    )
    op.create_table(
        "practice_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("candidate_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("problem_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("language", sa.String(length=50), nullable=False),
        sa.Column("source_code", sa.Text(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("attempted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["candidate_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["problem_id"], ["practice_problems.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_practice_attempts_candidate_id"), "practice_attempts", ["candidate_id"], unique=False)
    op.create_index(op.f("ix_practice_attempts_problem_id"), "practice_attempts", ["problem_id"], unique=False)
    op.create_table(
        "practice_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("candidate_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("total_solved", sa.Integer(), nullable=False),
        sa.Column("category_breakdown", sa.JSON(), nullable=False),
        sa.Column("last_active", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["candidate_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("candidate_id"),
    )


def downgrade() -> None:
    op.drop_table("practice_progress")
    op.drop_index(op.f("ix_practice_attempts_problem_id"), table_name="practice_attempts")
    op.drop_index(op.f("ix_practice_attempts_candidate_id"), table_name="practice_attempts")
    op.drop_table("practice_attempts")
    op.drop_table("ai_evaluations")
    op.drop_index(op.f("ix_candidate_submissions_invitation_id"), table_name="candidate_submissions")
    op.drop_table("candidate_submissions")
    op.drop_index(op.f("ix_test_cases_question_id"), table_name="test_cases")
    op.drop_table("test_cases")
    op.drop_index(op.f("ix_assessment_invitations_token"), table_name="assessment_invitations")
    op.drop_index(op.f("ix_assessment_invitations_candidate_id"), table_name="assessment_invitations")
    op.drop_index(op.f("ix_assessment_invitations_assessment_id"), table_name="assessment_invitations")
    op.drop_table("assessment_invitations")
    op.drop_index(op.f("ix_questions_assessment_id"), table_name="questions")
    op.drop_table("questions")
    op.drop_table("practice_problems")
    op.drop_index(op.f("ix_assessments_recruiter_id"), table_name="assessments")
    op.drop_table("assessments")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    sa.Enum(name="practice_category").drop(bind, checkfirst=True)
    sa.Enum(name="invitation_status").drop(bind, checkfirst=True)
    sa.Enum(name="difficulty").drop(bind, checkfirst=True)
    sa.Enum(name="user_role").drop(bind, checkfirst=True)
