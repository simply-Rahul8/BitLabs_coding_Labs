from fastapi import APIRouter, HTTPException, status
router = APIRouter(prefix="/assessments", tags=["assessments"])
def unavailable() -> None:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
router.add_api_route("", unavailable, methods=["GET", "POST"])
router.add_api_route("/{assessment_id}", unavailable, methods=["GET", "PATCH", "DELETE"])
