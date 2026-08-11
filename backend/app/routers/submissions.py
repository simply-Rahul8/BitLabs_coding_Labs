from fastapi import APIRouter, HTTPException, status
router = APIRouter(prefix="/submissions", tags=["submissions"])
@router.get("")
def list_submissions() -> None:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
