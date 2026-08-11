import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    EXPIRED = "expired"


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(
        Enum(Difficulty, name="difficulty", values_callable=lambda enum_class: [member.value for member in enum_class]),
        nullable=False,
    )
    time_limit_mins: Mapped[int] = mapped_column(Integer, nullable=False)
    language_support: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    recruiter: Mapped["User"] = relationship(back_populates="assessments")
    questions: Mapped[list["Question"]] = relationship(back_populates="assessment", cascade="all, delete-orphan")
    invitations: Mapped[list["AssessmentInvitation"]] = relationship(back_populates="assessment", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), nullable=False, index=True)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    constraints: Mapped[str] = mapped_column(Text, nullable=False)
    examples: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)

    assessment: Mapped[Assessment] = relationship(back_populates="questions")
    test_cases: Mapped[list["TestCase"]] = relationship(back_populates="question", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id"), nullable=False, index=True)
    input: Mapped[str] = mapped_column(Text, nullable=False)
    expected_output: Mapped[str] = mapped_column(Text, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_edge_case: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    question: Mapped[Question] = relationship(back_populates="test_cases")


class AssessmentInvitation(Base):
    __tablename__ = "assessment_invitations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), nullable=False, index=True)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(
            InvitationStatus,
            name="invitation_status",
            values_callable=lambda enum_class: [member.value for member in enum_class],
        ),
        default=InvitationStatus.PENDING,
        nullable=False,
    )

    assessment: Mapped[Assessment] = relationship(back_populates="invitations")
    candidate: Mapped["User"] = relationship(back_populates="invitations")
    submissions: Mapped[list["CandidateSubmission"]] = relationship(back_populates="invitation")
