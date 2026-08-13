import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.assessment import Difficulty


class PracticeCategory(str, enum.Enum):
    ARRAYS = "arrays"
    STRINGS = "strings"
    TREES = "trees"
    GRAPHS = "graphs"
    DP = "dp"
    SORTING = "sorting"
    SEARCHING = "searching"
    RECURSION = "recursion"
    HASHING = "hashing"


class PracticeProblem(Base):
    __tablename__ = "practice_problems"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[PracticeCategory] = mapped_column(
        Enum(
            PracticeCategory,
            name="practice_category",
            values_callable=lambda enum_class: [member.value for member in enum_class],
        ),
        nullable=False,
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        Enum(Difficulty, name="difficulty", values_callable=lambda enum_class: [member.value for member in enum_class]),
        nullable=False,
    )
    language_support: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    test_cases: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)

    attempts: Mapped[list["PracticeAttempt"]] = relationship(back_populates="problem", cascade="all, delete-orphan")


class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    problem_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("practice_problems.id"), nullable=True, index=True)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    source_code: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    candidate: Mapped["User"] = relationship(back_populates="practice_attempts")
    problem: Mapped[PracticeProblem | None] = relationship(back_populates="attempts")


class PracticeProgress(Base):
    __tablename__ = "practice_progress"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    total_solved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    category_breakdown: Mapped[dict[str, int]] = mapped_column(JSON, default=dict, nullable=False)
    last_active: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    candidate: Mapped["User"] = relationship(back_populates="practice_progress")
