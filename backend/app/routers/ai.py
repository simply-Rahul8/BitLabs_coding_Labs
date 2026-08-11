from fastapi import APIRouter, HTTPException, status
router = APIRouter(prefix="/ai", tags=["ai"])
@router.post("")
def request_ai_assistance() -> None:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
