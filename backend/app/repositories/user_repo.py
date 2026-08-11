import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User, UserRole


class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        return db.scalar(select(User).where(User.email == email))

    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def create(db: Session, email: str, hashed_password: str, role: str | UserRole) -> User:
        user = User(email=email, hashed_password=hashed_password, role=UserRole(role))
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
