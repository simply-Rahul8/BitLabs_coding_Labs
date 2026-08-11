import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class PracticeProblemOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    category: str
    difficulty: str
    language_support: list[str]

    model_config = ConfigDict(from_attributes=True)


class PracticeProblemDetail(PracticeProblemOut):
    test_cases: list[dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)


class PracticeSubmit(BaseModel):
    problem_id: uuid.UUID
    source_code: str
    language: str

    model_config = ConfigDict(from_attributes=True)


class ProgressOut(BaseModel):
    total_solved: int
    category_breakdown: dict[str, int]
    last_active: datetime

    model_config = ConfigDict(from_attributes=True)
