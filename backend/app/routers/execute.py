from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models import User
from app.services.execution_service import DockerExecutionService


router = APIRouter(prefix="/execute", tags=["execute"])


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


@router.post("/run", response_model=RunResponse)
async def execute_code(
    payload: RunRequest, current_user: User = Depends(get_current_user)
) -> RunResponse:
    supported_languages = {"python", "c", "cpp", "java", "javascript"}
    if payload.language not in supported_languages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported language")
    timeout = min(int(settings.EXECUTION_TIMEOUT), 15)
    result = await DockerExecutionService().execute(
        source_code=payload.source_code,
        language=payload.language,
        stdin=payload.stdin,
        timeout=timeout,
    )
    return RunResponse(**result)
