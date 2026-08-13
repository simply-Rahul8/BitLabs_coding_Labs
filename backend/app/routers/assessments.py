import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_recruiter, require_candidate
from app.core.security import hash_password
from app.models import AssessmentInvitation, User, UserRole, InvitationStatus
from app.repositories import AssessmentRepository, InvitationRepository, UserRepository
from app.schemas.assessment import AssessmentCreate, AssessmentOut, QuestionCreate, TestCaseCreate
from app.services.ai_service import AIService

router = APIRouter(prefix="/assessments", tags=["assessments"])
ai_service = AIService()


class QuestionWithTestCases(QuestionCreate):
    test_cases: list[TestCaseCreate]

    model_config = ConfigDict(from_attributes=True)


class AssessmentCreateRequest(AssessmentCreate):
    questions: list[QuestionWithTestCases]

    model_config = ConfigDict(from_attributes=True)


class GenerateAITestsRequest(BaseModel):
    question_id: uuid.UUID
    problem_statement: str
    language: str
    difficulty: str

    model_config = ConfigDict(from_attributes=True)


class SaveAITestsRequest(BaseModel):
    question_id: uuid.UUID
    test_cases: list[TestCaseCreate]

    model_config = ConfigDict(from_attributes=True)


class InviteRequest(BaseModel):
    candidate_email: str
    expires_hours: int = 48

    model_config = ConfigDict(from_attributes=True)


async def get_assessment_or_404(db: Session, assessment_id: uuid.UUID, recruiter_id: uuid.UUID):
    assessment = AssessmentRepository.get_by_id(db, assessment_id)
    if assessment is None or assessment.recruiter_id != recruiter_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return assessment


@router.post("/", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreateRequest,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> AssessmentOut:
    assessment = AssessmentRepository.create(db, recruiter.id, payload)
    for question_data in payload.questions:
        question = AssessmentRepository.add_question(db, assessment.id, question_data)
        AssessmentRepository.add_test_cases(db, question.id, question_data.test_cases)
    assessment.questions = AssessmentRepository.get_questions(db, assessment.id)
    return assessment


@router.get("/", response_model=list[AssessmentOut])
async def list_assessments(
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> list[AssessmentOut]:
    return AssessmentRepository.get_by_recruiter(db, recruiter.id)


@router.get("/candidate/invitations")
async def get_candidate_invitations(
    candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    invitations = InvitationRepository.get_by_candidate(db, candidate.id)
    out = []
    for inv in invitations:
        assessment = inv.assessment
        submission = inv.submissions[0] if inv.submissions else None
        out.append({
            "invitation_id": str(inv.id),
            "assessment_id": str(assessment.id),
            "title": assessment.title,
            "description": assessment.description,
            "difficulty": assessment.difficulty,
            "time_limit_mins": assessment.time_limit_mins,
            "status": inv.status.value,
            "token": inv.token,
            "expires_at": inv.expires_at,
            "test_url": f"/assessment/{inv.token}",
            "score": submission.score if submission else None,
        })
    return out


@router.post("/invitations/{invitation_id}/approve")
async def approve_invitation(
    invitation_id: uuid.UUID,
    candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    invitations = InvitationRepository.get_by_candidate(db, candidate.id)
    inv = next((i for i in invitations if i.id == invitation_id), None)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    if inv.status.value == "pending":
        inv = InvitationRepository.update_status(db, inv.id, "active")
    return {
        "status": inv.status.value,
        "token": inv.token,
        "test_url": f"/assessment/{inv.token}",
    }


@router.get("/invite/{token}")
async def get_invitation_by_token(token: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    invitation = InvitationRepository.get_by_token(db, token)
    if invitation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    assessment = invitation.assessment
    candidate_email = invitation.candidate.email if invitation.candidate else None
    questions = AssessmentRepository.get_questions(db, assessment.id)
    questions_data = []
    for q in questions:
        test_cases = AssessmentRepository.get_test_cases(db, q.id)
        test_cases_data = []
        for tc in test_cases:
            if tc.is_hidden:
                test_cases_data.append({
                    "id": str(tc.id),
                    "is_hidden": True,
                })
            else:
                test_cases_data.append({
                    "id": str(tc.id),
                    "is_hidden": False,
                    "input": tc.input,
                    "expected_output": tc.expected_output,
                })

        questions_data.append({
            "id": str(q.id),
            "problem_statement": q.problem_statement,
            "constraints": q.constraints,
            "examples": q.examples,
            "starter_code": q.starter_code,
            "test_cases": test_cases_data,
        })
    return {
        "token": invitation.token,
        "assessment_id": str(assessment.id),
        "assessment_title": assessment.title,
        "assessment_description": assessment.description,
        "difficulty": assessment.difficulty,
        "time_limit_mins": assessment.time_limit_mins,
        "questions": questions_data,
        "expires_at": invitation.expires_at,
        "status": invitation.status.value,
        "candidate_email": candidate_email,
        "recruiter_id": str(assessment.recruiter_id),
        "has_submission": len(invitation.submissions) > 0,
    }


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(
    assessment_id: uuid.UUID,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> AssessmentOut:
    assessment = await get_assessment_or_404(db, assessment_id, recruiter.id)
    assessment.questions = AssessmentRepository.get_questions(db, assessment.id)
    return assessment


class GenerateAITestsNewRequest(BaseModel):
    problem_statement: str
    language: str
    difficulty: str

    model_config = ConfigDict(from_attributes=True)


@router.post("/generate-ai-tests")
async def generate_ai_tests_new(
    payload: GenerateAITestsNewRequest,
    recruiter: User = Depends(require_recruiter),
) -> dict[str, Any]:
    return await ai_service.generate_test_cases(payload.problem_statement, payload.language, payload.difficulty)


@router.post("/{assessment_id}/ai-tests")
async def generate_ai_tests(
    assessment_id: uuid.UUID,
    payload: GenerateAITestsRequest,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    assessment = await get_assessment_or_404(db, assessment_id, recruiter.id)
    assessment.questions = AssessmentRepository.get_questions(db, assessment.id)
    if not any(question.id == payload.question_id for question in assessment.questions):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found for this assessment")
    return await ai_service.generate_test_cases(payload.problem_statement, payload.language, payload.difficulty)


@router.post("/{assessment_id}/save-ai-tests")
async def save_ai_tests(
    assessment_id: uuid.UUID,
    payload: SaveAITestsRequest,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    assessment = await get_assessment_or_404(db, assessment_id, recruiter.id)
    assessment.questions = AssessmentRepository.get_questions(db, assessment.id)
    if not any(question.id == payload.question_id for question in assessment.questions):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found for this assessment")
    saved_cases = AssessmentRepository.add_test_cases(db, payload.question_id, payload.test_cases)
    return {"saved_count": len(saved_cases)}


@router.post("/{assessment_id}/invite")
async def invite_candidate(
    assessment_id: uuid.UUID,
    payload: InviteRequest,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    assessment = await get_assessment_or_404(db, assessment_id, recruiter.id)
    candidate = UserRepository.get_by_email(db, payload.candidate_email)
    if candidate:
        if candidate.role != UserRole.CANDIDATE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User exists but is not a candidate")
        
        statement = select(AssessmentInvitation).where(
            AssessmentInvitation.candidate_id == candidate.id,
            AssessmentInvitation.assessment_id == assessment.id
        )
        existing = db.scalar(statement)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This candidate has already been invited to this assessment."
            )
    else:
        candidate = UserRepository.create(
            db,
            email=payload.candidate_email,
            hashed_password=hash_password("candidate123"),
            role=UserRole.CANDIDATE,
        )
    token = uuid.uuid4().hex
    expires_at = datetime.utcnow() + timedelta(hours=payload.expires_hours)
    invitation = InvitationRepository.create(db, assessment.id, candidate.id, token, expires_at)
    return {
        "token": invitation.token,
        "invite_url": f"/api/v1/assessments/invite/{invitation.token}",
        "expires_at": invitation.expires_at,
        "candidate_email": candidate.email,
    }


@router.get("/{assessment_id}/results")
async def get_assessment_results(
    assessment_id: uuid.UUID,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    assessment = await get_assessment_or_404(db, assessment_id, recruiter.id)
    statement = select(AssessmentInvitation).where(AssessmentInvitation.assessment_id == assessment.id)
    invitations = list(db.scalars(statement).all())
    results: list[dict[str, Any]] = []
    for invitation in invitations:
        submission = invitation.submissions[0] if invitation.submissions else None
        ai_eval = submission.ai_evaluation if submission else None
        results.append(
            {
                "candidate_email": invitation.candidate.email,
                "status": invitation.status.value,
                "score": submission.score if submission else None,
                "ai_evaluation": {
                    "ai_score": ai_eval.ai_score,
                    "strengths": ai_eval.strengths,
                    "weaknesses": ai_eval.weaknesses,
                    "recommendations": ai_eval.recommendations,
                }
                if ai_eval
                else None,
            }
        )
    return results
