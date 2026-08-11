import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SubmissionCreate(BaseModel):
    invitation_token: str
    source_code: str
    language: str

    model_config = ConfigDict(from_attributes=True)


class SubmissionOut(BaseModel):
    id: uuid.UUID
    invitation_id: uuid.UUID
    source_code: str
    language: str
    score: float | None
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AIEvaluationOut(BaseModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    strengths: str
    weaknesses: str
    recommendations: str
    ai_score: float

    model_config = ConfigDict(from_attributes=True)
