from fastapi import APIRouter, HTTPException, status
router = APIRouter(prefix="/practice", tags=["practice"])
@router.get("")
def list_practice_problems() -> None:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
