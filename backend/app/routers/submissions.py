import asyncio
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.core.security import decode_access_token
from app.models import InvitationStatus, User
from app.repositories import AssessmentRepository, InvitationRepository, SubmissionRepository, UserRepository
from app.schemas.submission import SubmissionCreate
from app.services.ai_service import AIService
from app.services.score_service import calculate_score
from app.services.test_runner import run_test_cases

router = APIRouter(prefix="/submissions", tags=["submissions"])
ai_service = AIService()


def get_optional_candidate(
    authorization: str | None = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if isinstance(subject, str):
            return UserRepository.get_by_id(db, uuid.UUID(subject))
    except Exception:
        pass
    return None


async def evaluate_submission_task(
    submission_id: uuid.UUID,
    source_code: str,
    language: str,
    test_case_payload: list[dict],
    problem_statement: str,
):
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        test_results = await run_test_cases(source_code, language, test_case_payload)
        score = calculate_score(test_results)
        SubmissionRepository.update_score_and_test_results(db, submission_id, score, test_results)

        try:
            ai_evaluation = await ai_service.evaluate_code(
                source_code,
                language,
                problem_statement,
                test_results,
            )
            SubmissionRepository.attach_ai_eval(
                db,
                submission_id,
                strengths=ai_evaluation["strengths"],
                weaknesses=ai_evaluation["weaknesses"],
                recommendations=ai_evaluation["recommendations"],
                ai_score=ai_evaluation["ai_score"],
                raw=ai_evaluation.get("raw_response", ai_evaluation),
            )
        except Exception:
            SubmissionRepository.attach_ai_eval(
                db,
                submission_id,
                strengths="AI evaluation could not be completed.",
                weaknesses="The code was submitted successfully, but the AI review failed.",
                recommendations="Please review this submission manually.",
                ai_score=0.0,
                raw={"error": "ai_evaluation_failed"},
            )
    finally:
        db.close()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_submission(
    payload: SubmissionCreate,
    response: Response,
    candidate: User | None = Depends(get_optional_candidate),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    invitation = InvitationRepository.get_by_token(db, payload.invitation_token)
    if invitation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    if candidate and invitation.candidate_id != candidate.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invitation does not belong to the authenticated candidate")
    if invitation.status == InvitationStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already completed")
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired")

    questions = AssessmentRepository.get_questions(db, invitation.assessment_id)
    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment question not found")

    question = questions[0]
    test_cases = AssessmentRepository.get_test_cases(db, question_id=question.id, hidden_only=False)
    test_case_payload = [{"input": case.input, "expected_output": case.expected_output, "is_hidden": case.is_hidden} for case in test_cases]

    submission = SubmissionRepository.create(db, invitation.id, payload.source_code, payload.language)
    InvitationRepository.update_status(db, invitation.id, "completed")

    task = asyncio.create_task(
        evaluate_submission_task(
            submission.id,
            payload.source_code,
            payload.language,
            test_case_payload,
            question.problem_statement,
        )
    )

    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=2.5)
        # Task completed within 2.5s
        db.refresh(submission)
        evaluation = submission.ai_evaluation
        return {
            "submission_id": submission.id,
            "score": submission.score,
            "test_results": submission.test_results,
            "ai_evaluation": {
                "ai_score": evaluation.ai_score,
                "strengths": evaluation.strengths,
                "weaknesses": evaluation.weaknesses,
                "recommendations": evaluation.recommendations,
            } if evaluation else None
        }
    except asyncio.TimeoutError:
        # Task is running in background. Return 202 Accepted.
        response.status_code = status.HTTP_202_ACCEPTED
        return {
            "submission_id": submission.id,
            "score": None,
            "test_results": None,
            "ai_evaluation": None
        }


@router.get("/{submission_id}")
async def get_submission(
    submission_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    submission = SubmissionRepository.get_by_id(db, submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    evaluation = submission.ai_evaluation
    return {
        "id": submission.id,
        "invitation_id": submission.invitation_id,
        "source_code": submission.source_code,
        "language": submission.language,
        "score": submission.score,
        "submitted_at": submission.submitted_at,
        "test_results": submission.test_results,
        "ai_evaluation": {
            "id": evaluation.id,
            "submission_id": evaluation.submission_id,
            "strengths": evaluation.strengths,
            "weaknesses": evaluation.weaknesses,
            "recommendations": evaluation.recommendations,
            "ai_score": evaluation.ai_score,
        }
        if evaluation
        else None,
    }
