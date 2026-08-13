import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Difficulty, PracticeAttempt, PracticeCategory, PracticeProblem, PracticeProgress


class PracticeRepository:
    @staticmethod
    def list_problems(
        db: Session, category: str | None = None, difficulty: str | None = None, page: int = 1, limit: int = 20
    ) -> list[PracticeProblem]:
        page = max(page, 1)
        limit = max(min(limit, 100), 1)
        statement = select(PracticeProblem)
        if category is not None:
            statement = statement.where(PracticeProblem.category == PracticeCategory(category))
        if difficulty is not None:
            statement = statement.where(PracticeProblem.difficulty == Difficulty(difficulty))
        statement = statement.offset((page - 1) * limit).limit(limit)
        return list(db.scalars(statement).all())

    @staticmethod
    def get_problem(db: Session, problem_id: uuid.UUID) -> PracticeProblem | None:
        return db.get(PracticeProblem, problem_id)

    @staticmethod
    def create_attempt(
        db: Session,
        candidate_id: uuid.UUID,
        language: str,
        source_code: str,
        is_correct: bool,
        problem_id: uuid.UUID | None = None,
    ) -> PracticeAttempt:
        attempt = PracticeAttempt(
            candidate_id=candidate_id,
            problem_id=problem_id,
            language=language,
            source_code=source_code,
            is_correct=is_correct,
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt

    @staticmethod
    def get_or_create_progress(db: Session, candidate_id: uuid.UUID) -> PracticeProgress:
        progress = db.scalar(select(PracticeProgress).where(PracticeProgress.candidate_id == candidate_id))
        if progress is not None:
            return progress
        progress = PracticeProgress(candidate_id=candidate_id, category_breakdown={})
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def update_progress(db: Session, candidate_id: uuid.UUID, category: str | PracticeCategory) -> PracticeProgress:
        progress = PracticeRepository.get_or_create_progress(db, candidate_id)
        category_key = category.value if isinstance(category, PracticeCategory) else category
        breakdown = dict(progress.category_breakdown or {})
        breakdown[category_key] = int(breakdown.get(category_key, 0)) + 1
        progress.total_solved += 1
        progress.category_breakdown = breakdown
        progress.last_active = datetime.utcnow()
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def increment_solved(db: Session, candidate_id: uuid.UUID) -> PracticeProgress:
        progress = PracticeRepository.get_or_create_progress(db, candidate_id)
        progress.total_solved += 1
        progress.last_active = datetime.utcnow()
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress
