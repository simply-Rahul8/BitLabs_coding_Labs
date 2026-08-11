import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str
    password: str
    role: Literal["recruiter", "candidate"]

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(from_attributes=True)
