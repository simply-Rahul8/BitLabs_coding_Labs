from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)

@router.post("/login")
def login(credentials: LoginRequest) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Authentication persistence is not configured")

@router.get("/me")
def read_current_user(current_user: dict[str, object] = Depends(get_current_user)) -> dict[str, object]:
    return current_user
