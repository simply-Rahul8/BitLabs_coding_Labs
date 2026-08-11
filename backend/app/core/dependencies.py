import uuid
from collections.abc import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models import User, UserRole
from app.repositories import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not isinstance(subject, str):
            raise ValueError("Access token subject is missing")
        user = UserRepository.get_by_id(db, uuid.UUID(subject))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}) from exc
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_recruiter(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter access is required")
    return user


def require_candidate(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate access is required")
    return user
