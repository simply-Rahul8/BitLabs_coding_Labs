import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TestCaseCreate(BaseModel):
    input: str
    expected_output: str
    is_hidden: bool
    is_edge_case: bool = False

    model_config = ConfigDict(from_attributes=True)


class TestCaseOut(BaseModel):
    id: uuid.UUID
    input: str
    expected_output: str
    is_hidden: bool
    is_edge_case: bool

    model_config = ConfigDict(from_attributes=True)


class QuestionCreate(BaseModel):
    problem_statement: str
    constraints: str
    examples: dict
    starter_code: dict[str, str] | None = None

    model_config = ConfigDict(from_attributes=True)


class QuestionOut(BaseModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    problem_statement: str
    constraints: str
    examples: dict
    test_cases: list[TestCaseOut]
    starter_code: dict[str, str] | None = None

    model_config = ConfigDict(from_attributes=True)


class AssessmentCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    time_limit_mins: int
    language_support: list[str]

    model_config = ConfigDict(from_attributes=True)


class AssessmentOut(BaseModel):
    id: uuid.UUID
    recruiter_id: uuid.UUID
    title: str
    description: str
    difficulty: str
    time_limit_mins: int
    language_support: list[str]
    created_at: datetime
    questions: list[QuestionOut]

    model_config = ConfigDict(from_attributes=True)


class InvitationOut(BaseModel):
    id: uuid.UUID
    token: str
    expires_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)
