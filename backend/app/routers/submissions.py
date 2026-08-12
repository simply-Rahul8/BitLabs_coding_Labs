import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_candidate
from app.models import InvitationStatus
from app.repositories import AssessmentRepository, InvitationRepository, SubmissionRepository
from app.schemas.submission import SubmissionCreate
from app.services.ai_service import AIService
from app.services.score_service import calculate_score
from app.services.test_runner import run_test_cases

router = APIRouter(prefix="/submissions", tags=["submissions"])
ai_service = AIService()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_submission(
    payload: SubmissionCreate,
    candidate=Depends(require_candidate),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    invitation = InvitationRepository.get_by_token(db, payload.invitation_token)
    if invitation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    if invitation.candidate_id != candidate.id:
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
    test_case_payload = [{"input": case.input, "expected_output": case.expected_output} for case in test_cases]

    test_results = await run_test_cases(payload.source_code, payload.language, test_case_payload)
    score = calculate_score(test_results)
    submission = SubmissionRepository.create(db, invitation.id, payload.source_code, payload.language)

    try:
        ai_evaluation = await ai_service.evaluate_code(
            payload.source_code,
            payload.language,
            question.problem_statement,
            test_results,
        )
        evaluation = SubmissionRepository.attach_ai_eval(
            db,
            submission.id,
            strengths=ai_evaluation["strengths"],
            weaknesses=ai_evaluation["weaknesses"],
            recommendations=ai_evaluation["recommendations"],
            ai_score=ai_evaluation["ai_score"],
            raw=ai_evaluation.get("raw_response", ai_evaluation),
        )
    except Exception:
        evaluation = SubmissionRepository.attach_ai_eval(
            db,
            submission.id,
            strengths="AI evaluation could not be completed.",
            weaknesses="The code was submitted successfully, but the AI review failed.",
            recommendations="Please review this submission manually.",
            ai_score=0.0,
            raw={"error": "ai_evaluation_failed"},
        )

    submission = SubmissionRepository.update_score(db, submission.id, score)
    InvitationRepository.update_status(db, invitation.id, "completed")

    return {
        "submission_id": submission.id,
        "score": submission.score,
        "test_results": test_results,
        "ai_evaluation": {
            "ai_score": evaluation.ai_score,
            "strengths": evaluation.strengths,
            "weaknesses": evaluation.weaknesses,
            "recommendations": evaluation.recommendations,
        },
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
