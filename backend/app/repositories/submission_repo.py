import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import AIEvaluation, CandidateSubmission


class SubmissionRepository:
    @staticmethod
    def create(db: Session, invitation_id: uuid.UUID, source_code: str, language: str) -> CandidateSubmission:
        submission = CandidateSubmission(invitation_id=invitation_id, source_code=source_code, language=language)
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission

    @staticmethod
    def get_by_id(db: Session, submission_id: uuid.UUID) -> CandidateSubmission | None:
        return db.get(CandidateSubmission, submission_id)

    @staticmethod
    def attach_ai_eval(
        db: Session,
        submission_id: uuid.UUID,
        strengths: str,
        weaknesses: str,
        recommendations: str,
        ai_score: float,
        raw: dict[str, Any],
    ) -> AIEvaluation:
        evaluation = AIEvaluation(
            submission_id=submission_id,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            ai_score=ai_score,
            raw_response=raw,
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        return evaluation

    @staticmethod
    def update_score(db: Session, submission_id: uuid.UUID, score: float) -> CandidateSubmission:
        submission = db.get(CandidateSubmission, submission_id)
        if submission is None:
            raise ValueError("Candidate submission not found")
        submission.score = score
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission
