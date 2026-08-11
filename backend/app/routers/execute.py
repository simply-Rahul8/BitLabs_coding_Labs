from fastapi import APIRouter, HTTPException, status
router = APIRouter(prefix="/execute", tags=["execute"])
@router.post("")
def execute_code() -> None:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
