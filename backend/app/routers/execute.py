from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.models import User
from app.services.execution_service import DockerExecutionService


router = APIRouter(prefix="/execute", tags=["execute"])


class RunRequest(BaseModel):
    source_code: str
    language: str
    stdin: str = ""
    invitation_token: str | None = None


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    error: str | None
    test_results: dict | None = None


@router.post("/run", response_model=RunResponse)
async def execute_code(
    payload: RunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RunResponse:
    supported_languages = {"python", "c", "cpp", "java", "javascript"}
    if payload.language not in supported_languages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported language")

    if payload.invitation_token:
        from app.repositories import InvitationRepository, AssessmentRepository
        from app.services.test_runner import run_test_cases

        invitation = InvitationRepository.get_by_token(db, payload.invitation_token)
        if invitation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

        questions = AssessmentRepository.get_questions(db, invitation.assessment_id)
        if not questions:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment question not found")

        question = questions[0]
        test_cases = AssessmentRepository.get_test_cases(db, question_id=question.id, hidden_only=False)
        test_case_payload = [
            {
                "input": case.input,
                "expected_output": case.expected_output,
                "is_hidden": case.is_hidden,
            }
            for case in test_cases
        ]

        timeout = min(int(settings.EXECUTION_TIMEOUT), 15)
        test_results = await run_test_cases(payload.source_code, payload.language, test_case_payload, timeout=timeout)

        passed = test_results.get("passed", 0)
        total = test_results.get("total", 0)

        scrubbed_results = []
        for r in test_results.get("results", []):
            if r.get("is_hidden", False):
                scrubbed_results.append({
                    "passed": r["passed"],
                    "is_hidden": True,
                    "input": "[Hidden]",
                    "expected": "[Hidden]",
                    "actual": "[Hidden]"
                })
            else:
                scrubbed_results.append({
                    "passed": r["passed"],
                    "is_hidden": False,
                    "input": r["input"],
                    "expected": r["expected"],
                    "actual": r["actual"]
                })

        return RunResponse(
            stdout="code execution successful" if passed == total else "test cases failed",
            stderr="",
            exit_code=0 if passed == total else 1,
            timed_out=False,
            error=None,
            test_results={
                "passed": passed,
                "total": total,
                "results": scrubbed_results
            }
        )

    timeout = min(int(settings.EXECUTION_TIMEOUT), 15)
    result = await DockerExecutionService().execute(
        source_code=payload.source_code,
        language=payload.language,
        stdin=payload.stdin,
        timeout=timeout,
    )
    return RunResponse(**result)
