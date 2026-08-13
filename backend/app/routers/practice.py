from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_candidate
from app.models import User
from app.repositories import PracticeRepository
from app.services.execution_service import DockerExecutionService
from app.services.ai_service import AIService

router = APIRouter(prefix="/practice", tags=["practice"])
ai_service = AIService()


class RunRequest(BaseModel):
    source_code: str
    language: str
    stdin: str = ""


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    error: str | None


class AIHintRequest(BaseModel):
    source_code: str
    language: str
    user_question: str | None = None


class AIEvaluateRequest(BaseModel):
    source_code: str
    language: str
    stdout: str
    problem_description: str | None = None


class LogAttemptRequest(BaseModel):
    source_code: str
    language: str
    ai_score: int
    is_correct: bool


@router.post("/run", response_model=RunResponse)
async def run_practice_code(
    payload: RunRequest,
    current_user: User = Depends(require_candidate),
) -> RunResponse:
    supported_languages = {"python", "c", "cpp", "java", "javascript"}
    if payload.language not in supported_languages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported language")
    result = await DockerExecutionService().execute(
        source_code=payload.source_code,
        language=payload.language,
        stdin=payload.stdin,
        timeout=10,
    )
    return RunResponse(**result)


@router.post("/ai-hint")
async def get_practice_hint(
    payload: AIHintRequest,
    current_user: User = Depends(require_candidate),
) -> dict[str, str]:
    return await ai_service.generate_mentor_hint(
        language=payload.language,
        source_code=payload.source_code,
        user_question=payload.user_question,
    )


@router.post("/ai-evaluate")
async def evaluate_practice_attempt(
    payload: AIEvaluateRequest,
    current_user: User = Depends(require_candidate),
) -> dict:
    return await ai_service.evaluate_practice_code(
        language=payload.language,
        source_code=payload.source_code,
        stdout=payload.stdout,
        problem_description=payload.problem_description,
    )


@router.post("/log")
async def log_practice_attempt(
    payload: LogAttemptRequest,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    PracticeRepository.create_attempt(
        db,
        candidate_id=current_user.id,
        language=payload.language,
        source_code=payload.source_code,
        is_correct=payload.is_correct,
        problem_id=None,
    )
    if payload.is_correct:
        PracticeRepository.increment_solved(db, current_user.id)
    return {"logged": True}


@router.get("/progress/")
async def get_practice_progress(
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> dict:
    progress = PracticeRepository.get_or_create_progress(db, current_user.id)
    return {
        "total_solved": progress.total_solved,
        "last_active": progress.last_active,
    }
