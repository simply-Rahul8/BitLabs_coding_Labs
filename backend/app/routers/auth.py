from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.core.dependencies import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.repositories import UserRepository
from app.schemas import Token, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    if UserRepository.get_by_email(db, payload.email) is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
    return UserRepository.create(
        db,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )

@router.post("/login", response_model=Token)
def login(credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = UserRepository.get_by_email(db, credentials.username)
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(str(user.id), role=user.role.value))

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
