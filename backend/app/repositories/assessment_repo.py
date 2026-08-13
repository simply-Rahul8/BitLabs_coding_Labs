import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Assessment, Difficulty, Question, TestCase
from app.schemas.assessment import AssessmentCreate, QuestionCreate, TestCaseCreate


class AssessmentRepository:
    @staticmethod
    def create(db: Session, recruiter_id: uuid.UUID, data: AssessmentCreate) -> Assessment:
        assessment = Assessment(
            recruiter_id=recruiter_id,
            title=data.title,
            description=data.description,
            difficulty=Difficulty(data.difficulty),
            time_limit_mins=data.time_limit_mins,
            language_support=data.language_support,
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment

    @staticmethod
    def get_by_id(db: Session, assessment_id: uuid.UUID) -> Assessment | None:
        statement = select(Assessment).options(selectinload(Assessment.questions)).where(Assessment.id == assessment_id)
        return db.scalar(statement)

    @staticmethod
    def get_by_recruiter(db: Session, recruiter_id: uuid.UUID) -> list[Assessment]:
        statement = select(Assessment).where(Assessment.recruiter_id == recruiter_id).order_by(Assessment.created_at.desc())
        return list(db.scalars(statement).all())

    @staticmethod
    def add_question(db: Session, assessment_id: uuid.UUID, data: QuestionCreate) -> Question:
        question = Question(
            assessment_id=assessment_id,
            problem_statement=data.problem_statement,
            constraints=data.constraints,
            examples=data.examples,
            starter_code=data.starter_code,
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        return question

    @staticmethod
    def add_test_cases(db: Session, question_id: uuid.UUID, cases: list[TestCaseCreate]) -> list[TestCase]:
        test_cases = [
            TestCase(
                question_id=question_id,
                input=case.input,
                expected_output=case.expected_output,
                is_hidden=case.is_hidden,
                is_edge_case=case.is_edge_case,
            )
            for case in cases
        ]
        db.add_all(test_cases)
        db.commit()
        for test_case in test_cases:
            db.refresh(test_case)
        return test_cases

    @staticmethod
    def get_questions(db: Session, assessment_id: uuid.UUID) -> list[Question]:
        statement = select(Question).options(selectinload(Question.test_cases)).where(Question.assessment_id == assessment_id)
        return list(db.scalars(statement).all())

    @staticmethod
    def get_test_cases(db: Session, question_id: uuid.UUID, hidden_only: bool = False) -> list[TestCase]:
        statement = select(TestCase).where(TestCase.question_id == question_id)
        if hidden_only:
            statement = statement.where(TestCase.is_hidden.is_(True))
        return list(db.scalars(statement).all())
