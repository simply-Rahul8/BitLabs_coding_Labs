import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CandidateSubmission(Base):
    __tablename__ = "candidate_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invitation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assessment_invitations.id"), nullable=False, index=True
    )
    source_code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    test_results: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    invitation: Mapped["AssessmentInvitation"] = relationship(back_populates="submissions")
    ai_evaluation: Mapped["AIEvaluation | None"] = relationship(back_populates="submission", uselist=False)


class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("candidate_submissions.id"), unique=True, nullable=False
    )
    strengths: Mapped[str] = mapped_column(Text, nullable=False)
    weaknesses: Mapped[str] = mapped_column(Text, nullable=False)
    recommendations: Mapped[str] = mapped_column(Text, nullable=False)
    ai_score: Mapped[float] = mapped_column(Float, nullable=False)
    raw_response: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    submission: Mapped[CandidateSubmission] = relationship(back_populates="ai_evaluation")
